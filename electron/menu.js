/**
 * Native application menu (v1.3.0 offline desktop shell).
 *
 * IDE actions are forwarded to the renderer over the
 * `"emu8086web:menu"` channel — action ids are plain strings so the web
 * build never imports this file. The renderer maps them in
 * `components/ide/ide-workspace.tsx` (search MENU_ACTION_IDS there).
 * Menu items carry no accelerators for IDE actions: keyboard shortcuts stay
 * handled by the page to avoid double-firing.
 */
const { Menu, dialog, shell } = require("electron");

const MENU_CHANNEL = "emu8086web:menu";

const REPO_URL = "https://github.com/nafiskabbo/emu_8086_web";
const ISSUES_URL = `${REPO_URL}/issues`;

function sendAction(focusedWindow, action) {
  const target =
    focusedWindow && !focusedWindow.isDestroyed() ? focusedWindow : null;
  if (target) target.webContents.send(MENU_CHANNEL, action);
}

function openExternal(url) {
  void shell.openExternal(url);
}

/**
 * @param {object} opts
 * @param {string} opts.appName
 * @param {boolean} opts.isDev
 * @param {() => void} opts.onCheckForUpdates
 */
function buildAppMenu({ appName, isDev, onCheckForUpdates }) {
  const isMac = process.platform === "darwin";
  const clickSend = (action) => (item, focusedWindow) =>
    sendAction(focusedWindow, action);

  const appMenu = {
    label: appName,
    submenu: [
      { role: "about" },
      { type: "separator" },
      {
        label: "Check for Updates…",
        click: () => onCheckForUpdates(),
      },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" },
    ],
  };

  const fileMenu = {
    label: "File",
    submenu: [
      { label: "New File…", click: clickSend("file:new") },
      { label: "Open File…", click: clickSend("file:open") },
      { type: "separator" },
      { label: "Save", click: clickSend("file:save") },
      { label: "Save As…", click: clickSend("file:save-as") },
      { type: "separator" },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  };

  const assembleMenu = {
    label: "Assemble",
    submenu: [
      { label: "Compile", click: clickSend("emu:assemble") },
      { label: "Run", click: clickSend("emu:run") },
      { label: "Pause", click: clickSend("emu:pause") },
      { label: "Step", click: clickSend("emu:step") },
      { label: "Reset", click: clickSend("emu:reset") },
    ],
  };

  const editMenu = {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "delete" },
      { role: "selectAll" },
    ],
  };

  const viewMenu = {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      ...(isDev ? [{ role: "toggleDevTools" }] : []),
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  };

  const windowMenu = {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      ...(isMac
        ? [{ type: "separator" }, { role: "front" }]
        : [{ role: "close" }]),
    ],
  };

  const helpMenu = {
    label: "Help",
    submenu: [
      { label: "Keyboard Shortcuts", click: clickSend("help:shortcuts") },
      { label: "ASCII Codes", click: clickSend("help:ascii") },
      { label: "Number Converter", click: clickSend("help:convert") },
      { type: "separator" },
      {
        label: "Report an Issue…",
        click: () => openExternal(ISSUES_URL),
      },
      {
        label: "Project on GitHub…",
        click: () => openExternal(REPO_URL),
      },
      ...(!isMac
        ? [
            { type: "separator" },
            { role: "about" },
            {
              label: "Check for Updates…",
              click: () => onCheckForUpdates(),
            },
          ]
        : []),
    ],
  };

  const template = isMac
    ? [appMenu, fileMenu, assembleMenu, editMenu, viewMenu, windowMenu, helpMenu]
    : [fileMenu, assembleMenu, editMenu, viewMenu, windowMenu, helpMenu];

  return Menu.buildFromTemplate(template);
}

/** Small warning dialog; the caller decides the message. */
function showUpdateError(window, message) {
  dialog.showMessageBox(window, {
    type: "warning",
    title: "Update check",
    message,
  });
}

module.exports = {
  MENU_CHANNEL,
  buildAppMenu,
  showUpdateError,
};
