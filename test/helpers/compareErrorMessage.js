const path = require('path');

const projectPath = path.resolve(__dirname, '..', '..').replace(/\\/g, '/');
const projectPathPattern = new RegExp(projectPath, 'g');
const CR = /\r/g;

// We need to remove all environment dependent features
function compareErrorMessage(msg) {
  const envIndependentMsg = msg
    .replace(/\\/g, '/')
    .replace(CR, '')
    .replace(projectPathPattern, '');

  expect(envIndependentMsg).toMatchSnapshot();
}

module.exports = compareErrorMessage;
