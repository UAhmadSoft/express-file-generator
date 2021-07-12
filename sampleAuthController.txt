const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const crypto = require('crypto');
const sendMail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    // payload + secret + expire time
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createsendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // Remove the password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  let user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // Generate Account Activation Link
  const activationToken = user.createAccountActivationLink();

  user.save({ validateBeforeSave: false });

  // 4 Send it to Users Email
  // const activationURL = `http://localhost:5000/api/users/confirmMail/${activationToken}`;
  let activationURL;
  if (process.env.NODE_ENV === 'development')
    activationURL = `${req.protocol}:\/\/${req.get(
      'host'
    )}/api/auth/confirmMail/${activationToken}`;
  else
    activationURL = `${req.protocol}:\/\/${req.get(
      'host'
    )}/confirmMail/${activationToken}`;

  console.log(`req.get('host')`, req.get('host'));
  console.log(`req.host`, req.host);
  console.log(`req.protocol`, req.protocol);

  const message = `GO to this link to activate your App Account : ${activationURL} .`;

  sendMail({
    email: user.email,
    message,
    subject: 'Your Account Activation Link for Smurf App !',
    user,
    template: 'signupEmail.ejs',
    url: activationURL,
  });
  res.status(200).json({
    status: 'Success',
    message: `Email Verification Link Successfully Sent to you email ${user.email}`,
    user,
  });
  // createsendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email);

  if (!email || !password) {
    //  check email and password exist
    return next(
      new AppError(' please proveide email and password ', 400)
    );
  }

  const user = await User.findOne({ email }).select('+password'); // select expiclity password

  if (!user)
    return next(
      new AppError(`No User found against email ${email}`, 404)
    );
  if (
    !user || // check user exist and password correct
    !(await user.correctPassword(password, user.password))
  ) {
    // candinate password,correctpassword
    return next(new AppError('incorrect email or password', 401));
  }

  console.log(`user`, user);

  if (user.activated === false)
    return next(
      new AppError(
        `Plz Activate your email by then Link sent to your email ${user.email}`,
        401
      )
    );

  // if eveything is ok
  createsendToken(user, 200, res);
});

exports.confirmMail = catchAsync(async (req, res) => {
  // 1 Hash The Avtivation Link
  // console.log(req.params.activationLink);

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.activationLink)
    .digest('hex');

  // console.log(hashedToken);

  const user = await User.findOne({
    activationLink: hashedToken,
  });

  if (!user)
    return next(new AppError(`Activation Link Invalid or Expired !`));
  // 3 Activate his Account
  user.activated = true;
  user.activationLink = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'Success',
    message: 'Account has been Activated Successfully !',
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1 Check if Email Exists
  const { email } = req.body;

  if (!email)
    return next(new AppError(`Plz provide Email with request`, 400));

  // 2 Check If User Exists with this email
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user)
    return next(
      new AppError(`No User Found against this Email : ${email}`, 400)
    );

  // 3 Create Password Reset Token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 4 Send it to Users Email
  // const resetURL = `localhost:5000/api/users/resetPassword/${resetToken}`;
  let resetURL;
  if (process.env.NODE_ENV === 'development')
    resetURL = `${req.protocol}:\/\/${req.get(
      'host'
    )}/api/auth/resetPassword/${resetToken}`;
  else
    resetURL = `${req.protocol}:\/\/${req.get(
      'host'
    )}/resetPassword/${resetToken}`;

  //    = `${req.protocol}://${req.get(
  //     'host'
  //   )}/api/users/resetPassword/${resetToken}`;

  const message = `Forgot Password . Update your Password at this link ${resetURL} if you actually request it
   . If you did NOT forget it , simply ignore this Email`;

  sendMail({
    email,
    message,
    subject: 'Your Password reset token (will expire in 20 minutes)',
    user,
    template: 'forgotPassword.ejs',
    url: resetURL,
  });

  res.status(200).json({
    status: 'Success',
    message: `Forget password link successfully sent to your email : ${email}`,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 Find the  user based on Token

  // console.log(req.params.resetToken);

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  // console.log(hashedToken);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  // 2 Check if user still exists and token is NOT Expired
  if (!user)
    return next(
      new AppError(`Reset Password Link Invalid or Expired !`)
    );

  // 3 Change Password and Log the User in
  const { password, passwordConfirm } = req.body;

  // console.log('passwords are', password, passwordConfirm);

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const token = signToken(user._id);

  // * If you don't want the user to be logged In after pass reset
  // * Remove token from respone
  res.status(200).json({
    status: 'success',
    token,
  });
});

//    Update Password for only logged in user

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  console.log(user);

  // 2) check if posted current Password is Correct
  if (
    !(await user.correctPassword(
      req.body.passwordCurrent,
      user.password
    ))
  ) {
    // currentpass,db pass
    return next(new AppError(' Your current password is wrong', 401));
  }

  // 3) if so update the  password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4) Log user in , send JWT
  createsendToken(user, 200, res);
});
