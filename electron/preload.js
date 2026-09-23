/**
 * Electron preload bridge (v1.3.0 offline desktop shell).
 * Runs with context isolation: exposes a minimal read-only flag plus a
 * one-way native-menu channel, and deliberately no Node APIs.
 */
const { contextBridge, ipcRenderer } = require("electron");

const MENU_CHANNEL = "emu8086web:menu";

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: () => true,
  platform: process.platform,
  onMenuAction: (callback) => {
    const handler = (_event, action) => callback(action);
    ipcRenderer.on(MENU_CHANNEL, handler);
    return () => ipcRenderer.removeListener(MENU_CHANNEL, handler);
  },
});
