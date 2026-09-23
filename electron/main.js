/**
 * Electron main process (v1.3.0 offline desktop shell).
 *
 * Packaged mode: forks the Next standalone server bundled at
 * `.next/standalone/server.js` on a free loopback port, waits for
 * `/api/health`, then shows the window. Works fully offline — the only
 * network use is loopback to itself.
 *
 * Dev mode (`ELECTRON_START_URL` set by `electron:dev`): loads the running
 * `next dev` server instead of spawning one.
 */
const { app, BrowserWindow, dialog, shell } = require("electron");
const { buildAppMenu, showUpdateError } = require("./menu");
const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const APP_NAME = "emu8086web";
const REPO_URL = "https://github.com/nafiskabbo/emu_8086_web";

const DEV_URL = process.env.ELECTRON_START_URL || "";
const HEALTH_PATH = "/api/health";
const START_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 250;

let serverChild = null;
let mainWindow = null;
let updaterStarted = false;

function isPackaged() {
  return app.isPackaged;
}

/** Absolute path of the bundled Next standalone server. */
function standaloneServerPath() {
  // Mirrors lib/electron/offline.ts resolveStandaloneServerPath
  // (duplicated here because main stays dependency-free plain JS).
  return path.join(process.resourcesPath, ".next", "standalone", "server.js");
}

/** Resolve a free loopback port, honoring PORT when usable. */
function pickPort() {
  const fromEnv = Number.parseInt(process.env.PORT || "", 10);
  const candidates =
    Number.isInteger(fromEnv) && fromEnv >= 1024 && fromEnv <= 65535
      ? [fromEnv, 0]
      : [0];
  return new Promise((resolve, reject) => {
    const tryNext = () => {
      const want = candidates.shift();
      if (want === undefined) {
        reject(new Error("No free port available"));
        return;
      }
      const probe = net.createServer();
      // Swallow any late errors (e.g. from close() after a failed listen).
      probe.once("error", () => {
        try {
          probe.close();
        } catch {
          /* already closed */
        }
        tryNext();
      });
      probe.listen(want === 0 ? 0 : want, "127.0.0.1", () => {
        const address = probe.address();
        const port = typeof address === "object" && address ? address.port : 0;
        probe.close(() => resolve(port));
      });
    };
    tryNext();
  });
}

/** Start the bundled Next server; resolves with its base URL. */
function startBundledServer() {
  const serverFile = standaloneServerPath();
  const fs = require("node:fs");
  if (!fs.existsSync(serverFile)) {
    throw new Error(
      `Bundled server not found at ${serverFile}. Run "bun run electron:build" first.`,
    );
  }
  return pickPort().then(
    (port) =>
      new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [serverFile], {
          env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
          stdio: "ignore",
        });
        serverChild = child;
        child.once("error", (err) => reject(err));
        child.once("exit", (code) => {
          if (!mainWindow) {
            reject(new Error(`Bundled server exited early (code ${code})`));
          }
        });
        waitForHealth(port).then(
          () => resolve(`http://127.0.0.1:${port}`),
          (err) => reject(err),
        );
      }),
  );
}

/** Poll /api/health until the server answers or the timeout elapses. */
function waitForHealth(port) {
  const deadline = Date.now() + START_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const poll = () => {
      const req = http.get(
        { host: "127.0.0.1", port, path: HEALTH_PATH, timeout: 2000 },
        (res) => {
          res.resume();
          if (res.statusCode === 200) {
            resolve();
          } else if (Date.now() > deadline) {
            reject(new Error("Bundled server did not become healthy in time"));
          } else {
            setTimeout(poll, POLL_INTERVAL_MS);
          }
        },
      );
      req.once("error", () => {
        if (Date.now() > deadline) {
          reject(new Error("Bundled server did not become healthy in time"));
        } else {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      });
      req.once("timeout", () => {
        req.destroy();
        // A timed-out probe emits no response/error — keep polling.
        if (Date.now() > deadline) {
          reject(new Error("Bundled server did not become healthy in time"));
        } else {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      });
    };
    poll();
  });
}

function focusedWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
}

/** electron-updater is only meaningful in the packaged app. */
function getUpdater() {
  if (!app.isPackaged) return null;
  try {
    return require("electron-updater").autoUpdater;
  } catch {
    return null;
  }
}

/**
 * Background update check shortly after launch, plus a ready-to-install
 * prompt. Silent on failure — manual checks surface errors instead.
 * Note: on macOS the downloaded update can only auto-install in a properly
 * signed + notarized build; otherwise the user reinstalls from the DMG.
 */
function setupAutoUpdater() {
  const updater = getUpdater();
  if (!updater || updaterStarted) return;
  updaterStarted = true;
  updater.autoDownload = true;
  updater.on("update-downloaded", (info) => {
    const version = info && info.version ? String(info.version) : "new";
    dialog
      .showMessageBox(focusedWindow(), {
        type: "info",
        buttons: ["Restart now", "Later"],
        defaultId: 0,
        title: "Update ready",
        message: `${APP_NAME} v${version} downloaded. Restart to install?`,
      })
      .then(({ response }) => {
        if (response === 0) updater.quitAndInstall();
      });
  });
  updater.on("error", () => {
    /* background check stays silent */
  });
  setTimeout(() => {
    updater.checkForUpdatesAndNotify().catch(() => {});
  }, 15000);
}

/** Menu-driven check with explicit up-to-date / failure dialogs. */
function manualCheckForUpdates() {
  const updater = getUpdater();
  if (!updater) {
    showUpdateError(
      focusedWindow(),
      app.isPackaged
        ? "Auto-update is unavailable in this build."
        : "Auto-update only runs in the packaged app, not in dev mode.",
    );
    return;
  }
  void updater.checkForUpdates().then(
    ({ updateInfo }) => {
      const latest =
        updateInfo && updateInfo.version ? String(updateInfo.version) : "";
      const current = app.getVersion();
      if (latest && latest !== current) {
        dialog.showMessageBox(focusedWindow(), {
          type: "info",
          title: "Update available",
          message: `${APP_NAME} v${latest} is downloading in the background. You will be asked to restart when it is ready.`,
        });
      } else {
        dialog.showMessageBox(focusedWindow(), {
          type: "info",
          title: "No updates",
          message: `You are on the latest version (v${current}).`,
        });
      }
    },
    (err) =>
      showUpdateError(
        focusedWindow(),
        `Update check failed: ${err instanceof Error ? err.message : String(err)}`,
      ),
  );
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "emu8086web",
    backgroundColor: "#0b0f14",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // External links open in the system browser, never in the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (!target.startsWith("http://127.0.0.1:") && !target.startsWith("http://localhost:")) {
      void shell.openExternal(target);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  void mainWindow.loadURL(url);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function showFatal(message) {
  dialog.showErrorBox("emu8086web failed to start", message);
}

app.whenReady().then(() => {
  app.setName(APP_NAME);
  app.setAboutPanelOptions({
    applicationName: APP_NAME,
    applicationVersion: app.getVersion(),
    copyright: "© Nafis Islam Kabbo (MIT)",
    website: REPO_URL,
  });

  const { Menu } = require("electron");
  Menu.setApplicationMenu(
    buildAppMenu({
      appName: APP_NAME,
      isDev: DEV_URL !== "",
      onCheckForUpdates: () => manualCheckForUpdates(),
    }),
  );
  setupAutoUpdater();

  const start = DEV_URL
    ? Promise.resolve(DEV_URL)
    : isPackaged()
      ? startBundledServer()
      : Promise.resolve("http://127.0.0.1:3000");
  start.then(
    (url) => createWindow(url),
    (err) => {
      showFatal(err instanceof Error ? err.message : String(err));
      app.quit();
    },
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const fallback = DEV_URL || "http://127.0.0.1:3000";
      createWindow(fallback);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverChild) {
    try {
      serverChild.kill();
    } catch {
      /* already gone */
    }
    serverChild = null;
  }
});
