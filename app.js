const fs = require('fs');
const prompt = require('prompt-sync')();
require('colors');

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
let fileController;
let fileRouter;
let fileModel;
try {
  fileController = fs.readFileSync('./sampleController.txt', 'utf-8');

  fileRouter = fs.readFileSync('./sampleRouter.txt', 'utf-8');
  fileModel = fs.readFileSync('./sampleModel.txt', 'utf-8');
} catch (err) {
  console.error(err);
}

const generateFile = (type) => {
  // console.log(`file`, file);
  let variableName = prompt(`Name Of ${type} : \t`);
  // console.log(`variableName`, variableName);

  // console.log(`fileController`, fileController);
  let file;
  switch (type) {
    case 'controller':
      file = fileController.replace(
        /<VARIABLE_CAPITALIZE>/g,
        capitalizeFirstLetter(variableName)
      );
      file = file.replace(
        /<VARIABLE_LOWERCASE>/g,
        variableName.toLowerCase()
      );
      break;
    case 'router':
      file = fileRouter.replace(
        /<VARIABLE_CAPITALIZE>/g,
        capitalizeFirstLetter(variableName)
      );
      file = file.replace(
        /<VARIABLE_LOWERCASE>/g,
        variableName.toLowerCase()
      );
      break;
    case 'model':
      file = fileModel.replace(
        /<VARIABLE_CAPITALIZE>/g,
        capitalizeFirstLetter(variableName)
      );
      file = file.replace(
        /<VARIABLE_LOWERCASE>/g,
        variableName.toLowerCase()
      );
      break;

    default:
      break;
  }

  // console.log(`file`, file);

  fs.writeFileSync(
    `${variableName}${capitalizeFirstLetter(type)}.js`,
    file,
    (err) => {
      if (err) {
        return console.error(
          `Autsch! Failed to store template: ${err.message}.`
        );
      }

      console.log(`Saved File Successfully!`.green);
    }
  );
  console.log(
    `${variableName}${capitalizeFirstLetter(
      type
    )}.js Created Successfully !`.green
  );
};

let validTypes = ['controller', 'model', 'router'];

console.log('Enter exit to quit Application !\n');
while (true) {
  console.log(
    '\nEnter Type of File you want to generate : \ncontroller|router|model\n'
  );
  let type = prompt(' :  ');

  if (!type || type.toLowerCase() === 'exit') {
    process.exit();
  }

  if (!validTypes.includes(type.toLowerCase()))
    console.log(
      '\nPlz Enter a Valid Type \ncontroller|router|model \n'.red
    );
  else {
    generateFile(type);
  }
}
