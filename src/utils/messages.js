// prettier-ignore
const MESSAGES = {
  INFO_ACTIVATE_START: `Activating Faster Format with CLI`,
  INFO_ACTIVATE_COMPLETE: `Faster Format with CLI Activated. Use Developer:Set Log Level... setting to debug and get more logs`,
  INFO_TERMINAL_ATTACH: `Terminal Attached`,
  INFO_FORMATTING_SETTINGS: (languageId, mode, cmd) => `\nFormatting Language: ${languageId} Mode: ${mode} Command: ${cmd}`,
  DEBUG_FORMAT_COMMAND: (command, fileName) => `\nWill run the command \r\n${command}\r\nto format the document \r\n${fileName}`,
  DEBUG_FORMAT_RESULT: (output) => `\nFormat Result\r\n${output}`,
  ERROR_FILE_TYPE: `Faster Format with CLI currently only supports local files`,
  ERROR_UNKNOWN_MODE: `Unknown Extension Mode. Refer https://github.com/dhananjaipai/vscode-faster-format-with-cli/blob/main/README.md for supported modes`,
  WARN_NO_WORKSPACE: `The formatter is not running in a workspace, some functions may be restricted`,
};

module.exports = {
  MESSAGES,
};
