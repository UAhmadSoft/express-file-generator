#!/usr/bin/env node
var inquirer = require('inquirer');

const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
require('colors');

const getChoices1 = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Which  file you wanna create ?',
      choices: [
        'controller',
        'router',
        'model',
        new inquirer.Separator(),
        'others (utils  , middlewares etc',
        new inquirer.Separator(),
        'exit',
      ],
    },
  ]);

  // console.log(`answers`, answers);
  return answers.template;
};

const camelize = (str) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

const getChoices2 = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Which predefined file you create ?',
      choices: [
        'AppError',
        'CatchAsync',
        'AuthController',
        'GlobalErrorHandler',
        'Protect',
        'RestrictTo',
        new inquirer.Separator(),
        'back',
      ],
    },
  ]);

  // console.log(`answers`, answers);
  return answers.template;
};

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

let fileController;
let fileRouter;
let fileModel;

let fileAppError;
let fileCatchAsync;
let fileAuthController;
let fileGlobalErrorHandler;
let fileProtect;
let fileRestrictTo;

try {
  // * Template Files
  fileController = fs.readFileSync(
    path.join(__dirname, 'sampleController.txt'),
    'utf-8'
  );

  fileRouter = fs.readFileSync(
    path.join(__dirname, 'sampleRouter.txt'),
    'utf-8'
  );
  fileModel = fs.readFileSync(
    path.join(__dirname, 'sampleModel.txt'),
    'utf-8'
  );

  // * Pre Defined
  fileAppError = fs.readFileSync(
    path.join(__dirname, 'sampleAppError.txt'),
    'utf-8'
  );

  fileCatchAsync = fs.readFileSync(
    path.join(__dirname, 'sampleCatchAsync.txt'),
    'utf-8'
  );
  fileAuthController = fs.readFileSync(
    path.join(__dirname, 'sampleAuthController.txt'),
    'utf-8'
  );
  fileGlobalErrorHandler = fs.readFileSync(
    path.join(__dirname, 'sampleGlobalErrorHandler.txt'),
    'utf-8'
  );

  fileProtect = fs.readFileSync(
    path.join(__dirname, 'sampleProtect.txt'),
    'utf-8'
  );
  fileRestrictTo = fs.readFileSync(
    path.join(__dirname, 'sampleRestrictTo.txt'),
    'utf-8'
  );
} catch (err) {
  console.error(err);
}

const generatePreDefinedFiles = (temp) => {
  let file;
  switch (temp) {
    case 'AppError':
      file = fileAppError;
      break;
    case 'CatchAsync':
      file = fileCatchAsync;
      break;
    case 'AuthController':
      file = fileAuthController;
      break;
    case 'GlobalErrorHandler':
      file = fileGlobalErrorHandler;
      break;
    case 'Protect':
      file = fileProtect;
      break;
    case 'RestrictTo':
      file = fileRestrictTo;
      break;

    default:
      break;
  }

  fs.writeFileSync(`${camelize(temp)}.js`, file, (err) => {
    if (err) {
      return console.error(
        `Autsch! Failed to store template: ${err.message}.`
      );
    }

    console.log(`Saved File Successfully!`.green);
  });
  console.log(
    `${camelize(temp)}.js Created Successfully !\n\n`.green
  );
};

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
    )}.js Created Successfully !\n\n`.green
  );
};

let validTypes = ['controller', 'model', 'router'];

(async () => {
  while (true) {
    let template = await getChoices1();
    if (!template || template.toLowerCase() === 'exit') {
      process.exit();
    }

    if (validTypes.includes(template.toLowerCase()))
      generateFile(template);
    else {
      let template2 = await getChoices2();
      if (!template2 || template2.toLowerCase() === 'back') {
        // * Do Nothing
      } else {
        generatePreDefinedFiles(template2);
      }
    }
  }
})();
