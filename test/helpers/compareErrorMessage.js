const path = require('path');

const projectPath = path.resolve(__dirname, '..', '..');
const projectPathPattern = new RegExp(projectPath, 'g');

// We need to remove all environment dependent features
function compareErrorMessage(msg) {
  const envIndependentMsg = msg
    .replace(projectPathPattern, '')
    .replace(/\\/g, '/');

  expect(envIndependentMsg).toMatchSnapshot();
}

module.exports = compareErrorMessage;
