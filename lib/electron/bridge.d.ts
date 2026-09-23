/** Typing for the Electron preload bridge (offline desktop shell). */
interface ElectronBridge {
  isElectron: () => boolean;
  platform: NodeJS.Platform;
  onMenuAction?: (callback: (action: string) => void) => () => void;
}

interface Window {
  electronAPI?: ElectronBridge;
}
