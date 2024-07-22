const vscode = require("vscode");

// Wrapper for logging
const logError = (
  message = "Faster Format With CLI: Unknown Error",
  output = console,
  alert = true
) => {
  const error = new Error(message);
  output.error(error);
  if (alert) {
    vscode.window.showErrorMessage(message);
  }
  throw error;
};

module.exports = {
  logError,
};
