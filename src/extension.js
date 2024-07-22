const vscode = require("vscode");
const { execSync } = require("child_process");
const path = require("path");
const { writeFileSync, readFileSync, rmSync } = require("fs");
const { getCommand, getMode } = require("./utils/settings");
const { logError } = require("./utils/errors");

// Keeping messages in a common place for localization options in future
const MESSAGES = {
  INFO_ACTIVATE: "Activating Faster Format with CLI",
  DEBUG_FORMAT_COMMAND: (command, fileName) =>
    `Will run the command "${command}" to format the document "${fileName}"`,
  INFO_FORMATTING_SETTINGS: (languageId, mode, cmd) =>
    `Formatting Language: ${languageId}
        Mode: ${mode}
        Command: ${cmd}`,
  DEBUG_TERMINAL_ATTACH: `Terminal attached`,
  ERROR_FILE_TYPE: "Faster Format with CLI currently only supports local files",
  ERROR_UNKNOWN_MODE:
    "Unknown Extension Mode. Refer https://github.com/dhananjaipai/vscode-faster-format-with-cli/blob/main/README.md for supported modes",
  WARN_NO_WORKSPACE:
    "The formatter is not running in a workspace, some functions may be restricted",
};

// Create output channel for debugging
const outputChannel = vscode.window.createOutputChannel("fasterFormatWithCLI", {
  log: true,
});

// Get workspace root to create temp file; Not currently used
// eslint-disable-next-line no-unused-vars
const getWorkspaceRootOfDocument = (uri) => {
  if (uri.scheme !== "file") logError(MESSAGES.ERROR_FILE_TYPE, outputChannel);
  const ws = vscode.workspace.getWorkspaceFolder(uri);
  if (ws) {
    return path.normalize(ws.uri.fsPath);
  } else {
    outputChannel.warn(MESSAGES.WARN_NO_WORKSPACE);
    vscode.env.appRoot;
  }
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
  outputChannel.info(MESSAGES.INFO_ACTIVATE);
  vscode.languages.getLanguages().then((languages) => {
    let disposable = vscode.languages.registerDocumentFormattingEditProvider(
      languages.map((language) => ({ language })),
      {
        provideDocumentFormattingEdits(doc) {
          const cmd = getCommand(doc.languageId);
          const mode = getMode(doc.languageId);
          outputChannel.info(
            MESSAGES.INFO_FORMATTING_SETTINGS(doc.languageId, mode, cmd)
          );
          // Formatter should return a ProviderResult; can be [] if empty
          switch (mode) {
            case "inline_file":
              return formatInlineFile(doc, cmd);
            case "inline_file_stdout":
              return formatInlineFileStdOUT(doc, cmd);
            case "inline_stdin":
              return formatInlineStdIN(doc, cmd);
            case "overwrite":
              return formatOverwrite(doc, cmd);
            default:
              logError(MESSAGES.ERROR_UNKNOWN_MODE, outputChannel);
              break;
          }
        },
      }
    );
    context.subscriptions.push(disposable);
  });
  outputChannel.info("Faster Format with CLI activated");
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

// Get terminal for running overwrite command
const getTerminal = (name = "fasterFormatWithCLI") => {
  let terminal = vscode.window.terminals.find((t) => t.name === name);
  if (!terminal) {
    console.log("no terminal found, creating");
    terminal = vscode.window.createTerminal(name);
  }
  terminal.hide();
  return terminal;
};

const writeTempFile = (doc) => {
  // const workspaceRoot = getWorkspaceRootOfDocument(doc.uri);
  // const tmpFile = path.join(workspaceRoot, `.~format-with-cli.tmp.${doc.fileName}`);
  const parent = path.dirname(doc.fileName);
  const tmpFile = path.join(
    parent,
    `.~format-with-cli.tmp${path.extname(doc.fileName)}`
  );
  try {
    writeFileSync(tmpFile, doc.getText(), { encoding: "utf-8", flag: "w" });
    return tmpFile;
  } catch ({ message }) {
    rmSync(tmpFile);
    logError(message, outputChannel);
  }
};

const updateEditorFile = (doc, content) => {
  const range = new vscode.Range(
    doc.lineAt(0).range.start,
    doc.lineAt(doc.lineCount - 1).range.end
  );
  const edit = vscode.TextEdit.replace(range, content);
  return edit;
};

const formatInlineFile = (doc, cmd) => {
  const tmpFile = writeTempFile(doc);
  try {
    const command = cmd.replaceAll("{file}", tmpFile);
    outputChannel.info(MESSAGES.DEBUG_FORMAT_COMMAND(command, doc.fileName));
    execSync(command, {
      encoding: "utf-8",
      windowsHide: true,
      // cwd: workspaceRoot,
    });
    const output = readFileSync(tmpFile, {
      encoding: "utf-8",
      flag: "r",
    });
    outputChannel.debug(`Format Result:\r\n${output}`);
    rmSync(tmpFile);

    /** Only edit document if there is output from formatter. */
    if (output === "") return [];

    const edit = updateEditorFile(doc, output);
    outputChannel.info("Document formatted");

    return [edit];
  } catch ({ message }) {
    rmSync(tmpFile);
    logError(message, outputChannel);
  }
};

const formatInlineFileStdOUT = (doc, cmd) => {
  const tmpFile = writeTempFile(doc);
  try {
    const command = cmd.replaceAll("{file}", tmpFile);
    outputChannel.info(MESSAGES.DEBUG_FORMAT_COMMAND(command, doc.fileName));
    const output = execSync(command, {
      encoding: "utf-8",
      windowsHide: true,
      // cwd: workspaceRoot,
    });
    outputChannel.debug(`Format Result:\r\n${output}`);
    rmSync(tmpFile);

    /** Only edit document if there is output from formatter. */
    if (output === "") return [];

    const edit = updateEditorFile(doc, output);
    outputChannel.info("Document formatted");

    return [edit];
  } catch ({ message }) {
    rmSync(tmpFile);
    logError(message, outputChannel);
  }
};

const formatInlineStdIN = (doc, cmd) => {
  try {
    const command = `echo '${doc.getText()}' | ${cmd.replaceAll("{file}", doc.fileName)}`;
    outputChannel.debug(MESSAGES.DEBUG_FORMAT_COMMAND(command, doc.fileName));
    const output = execSync(command, {
      encoding: "utf-8",
      windowsHide: true,
      // cwd: workspaceRoot,
    });
    outputChannel.debug(`Format Result:\r\n${output}`);

    /** Only edit document if there is output from formatter. */
    if (output === "") return [];

    const edit = updateEditorFile(doc, output);
    outputChannel.info("Document formatted");

    return [edit];
  } catch ({ message }) {
    logError(message, outputChannel);
  }
};

const formatOverwrite = (doc, cmd) => {
  try {
    const terminal = getTerminal();
    console.log("here");
    outputChannel.debug(MESSAGES.DEBUG_TERMINAL_ATTACH);
    const command = cmd.replaceAll("{file}", doc.fileName);
    terminal.sendText(command);
    outputChannel.info(`Command executed`);
    return [];
  } catch ({ message }) {
    logError(message, outputChannel);
  }
};
