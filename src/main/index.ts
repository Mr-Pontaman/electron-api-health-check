import { join } from "node:path";
import { app, BrowserWindow, shell } from "electron";
import icon from "../../resources/icon.png?asset";
import { closePrisma } from "./db/client";
import { applyMigrations } from "./db/migrate";
import { registerApiTargetHandlers } from "./ipc/api-target";
import { registerBackupHandlers } from "./ipc/backup";
import { registerHealthCheckHandlers } from "./ipc/health-check";
import { registerVaultHandlers } from "./ipc/vault";

const registerDevToolsShortcut = (window: BrowserWindow): void => {
	window.webContents.on("before-input-event", (event, input) => {
		if (input.type !== "keyDown" || input.isAutoRepeat) return;

		const isF12 = input.key === "F12";
		const isToggle =
			input.control && input.shift && input.key.toLowerCase() === "i";
		if (!isF12 && !isToggle) return;

		event.preventDefault();
		if (window.webContents.isDevToolsOpened()) {
			window.webContents.closeDevTools();
		} else {
			window.webContents.openDevTools({ mode: "detach" });
		}
	});
};

const createWindow = (): void => {
	const mainWindow = new BrowserWindow({
		width: 1180,
		height: 820,
		show: false,
		autoHideMenuBar: true,
		...(process.platform === "linux" ? { icon: icon } : {}),
		webPreferences: {
			preload: join(__dirname, "../preload/index.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	mainWindow.once("ready-to-show", () => {
		mainWindow.show();
	});
	mainWindow.webContents.once("did-finish-load", () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		void shell.openExternal(url);
		return { action: "deny" };
	});

	mainWindow.webContents.on(
		"did-fail-load",
		(_event, errorCode, errorDescription, validatedURL) => {
			console.error(
				`[renderer] 読み込み失敗 code=${errorCode} ${errorDescription} url=${validatedURL}`,
			);
		},
	);

	const rendererUrl = process.env.ELECTRON_RENDERER_URL;
	if (!app.isPackaged) {
		registerDevToolsShortcut(mainWindow);
	}
	if (!app.isPackaged && rendererUrl) {
		void mainWindow.loadURL(rendererUrl);
	} else {
		void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}
};

app.whenReady().then(() => {
	applyMigrations();

	registerVaultHandlers();
	registerBackupHandlers();
	registerApiTargetHandlers();
	registerHealthCheckHandlers();

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("before-quit", () => {
	void closePrisma();
});
