const vscode = require("vscode");

// Read Extension settings
const getCommand = (languageId = undefined) =>
  vscode.workspace
    .getConfiguration("djpai.format", { languageId })
    .get("command", 'npx prettier --write --ignore-unknown "{file}"');
const getMode = (languageId = undefined) =>
  vscode.workspace
    .getConfiguration("djpai.format", { languageId })
    .get("mode", "inline_file");

module.exports = {
  getCommand,
  getMode,
};
