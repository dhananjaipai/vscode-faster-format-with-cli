const vscode = require("vscode");
const { execSync } = require("child_process");
const path = require("path");
const { writeFileSync, readFileSync, rmSync } = require("fs");
const { getCommand, getMode } = require("./utils/settings");
const { logError } = require("./utils/errors");

// Keeping messages in a common place for localization options in future
const { MESSAGES } = require("./utils/messages");

const disabledLanguages = ["jsonc"]; // Refer https://github.com/dhananjaipai/vscode-faster-format-with-cli/issues/3

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
async function activate(context) {
  outputChannel.info(MESSAGES.INFO_ACTIVATE_START);
  const registeredLanguages = await vscode.languages.getLanguages();
  const documentSelector = registeredLanguages.reduce((selector, language) => {
    if (!disabledLanguages.includes(language)) {
      selector.push({ scheme: "file", language });
    }
    return selector;
  }, []);
  const disposable = vscode.languages.registerDocumentFormattingEditProvider(documentSelector, {
    provideDocumentFormattingEdits(doc) {
      const cmd = getCommand(doc.languageId);
      const mode = getMode(doc.languageId);
      outputChannel.info(MESSAGES.INFO_FORMATTING_SETTINGS(doc.languageId, mode, cmd));
      // Formatter should return a ProviderResult; can be [] if empty
      if (mode === "inline_file") return formatInlineFile(doc, cmd);
      if (mode === "inline_file_stdout") return formatInlineFileStdOUT(doc, cmd);
      if (mode === "inline_stdin") return formatInlineStdIN(doc, cmd);
      if (mode === "overwrite") return formatOverwrite(doc, cmd);
      logError(MESSAGES.ERROR_UNKNOWN_MODE, outputChannel);
    },
  });
  context.subscriptions.push(disposable);
  outputChannel.info(MESSAGES.INFO_ACTIVATE_COMPLETE);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

// Get terminal for running command in overwrite mode
const getTerminal = (name = "fasterFormatWithCLI") => {
  let terminal = vscode.window.terminals.find((t) => t.name === name);
  if (!terminal) {
    terminal = vscode.window.createTerminal(name);
  }
  terminal.hide();
  return terminal;
};

const writeTempFile = (doc) => {
  // const workspaceRoot = getWorkspaceRootOfDocument(doc.uri);
  // const tmpFile = path.join(workspaceRoot, `.~format-with-cli.tmp.${doc.fileName}`);
  const parent = path.dirname(doc.fileName);
  const tmpFile = path.join(parent, `.~format-with-cli.tmp${path.extname(doc.fileName)}`);
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
    doc.lineAt(doc.lineCount - 1).range.end,
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
    outputChannel.debug(MESSAGES.DEBUG_FORMAT_RESULT(output));

    /** Only edit document if there is output from formatter. */
    if (output === "") {
      rmSync(tmpFile);
      return [];
    }

    const edit = updateEditorFile(doc, output);
    outputChannel.info("Document formatted");
    rmSync(tmpFile);
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
    outputChannel.debug(MESSAGES.DEBUG_FORMAT_RESULT(output));

    /** Only edit document if there is output from formatter. */
    if (output === "") {
      rmSync(tmpFile);
      return [];
    }

    const edit = updateEditorFile(doc, output);
    outputChannel.info("Document formatted");
    rmSync(tmpFile);
    return [edit];

  } catch ({ message }) {
    rmSync(tmpFile);
    logError(message, outputChannel);
  }
};

const formatInlineStdIN = (doc, cmd) => {
  try {
    const command = `cat <<'FSTRFMTWTCLIDLM' | ${cmd.replaceAll("{file}", doc.fileName)}\n${doc.getText()}\nFSTRFMTWTCLIDLM`;
    outputChannel.debug(MESSAGES.DEBUG_FORMAT_COMMAND(command, doc.fileName));

    const output = execSync(command, {
      encoding: "utf-8",
      windowsHide: true,
      // cwd: workspaceRoot,
    });
    outputChannel.debug(MESSAGES.DEBUG_FORMAT_RESULT(output));

    /** Only edit document if there is output from formatter. */
    if (output === "") {
      rmSync(tmpFile);
      return [];
    }

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
    outputChannel.debug(MESSAGES.INFO_TERMINAL_ATTACH);
    const command = cmd.replaceAll("{file}", doc.fileName);
    terminal.sendText(command);
    outputChannel.info(`Command executed`);
    return [];
  } catch ({ message }) {
    logError(message, outputChannel);
  }
};
