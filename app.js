//
//Einen ElectronJS App für die Ausführung von NodeJs Projekten mit Web Server
//
// nur für Windows
// Die App mach die Server Behandlung über die Shell Befehle
//
//Rodion Shapovalov
//
const {app, BrowserWindow, ipcMain, screen} = require('electron');
const path = require('path');
const fs = require('fs');
const {exec, spawn} = require('child_process');

let mainWindow;
let pids = [];
const IS_DEV_MODE = false;

// Fenster erstellen
function createWindow() {
	const primaryDisplay = screen.getPrimaryDisplay();
	mainWindow = new BrowserWindow({
		width: 800,
		height: primaryDisplay.workArea.height,
		webPreferences: {
			preload: path.join(__dirname, 'renderer', 'js', 'preload.js'), // Lade das Preload-Skript
			devTools: IS_DEV_MODE,
		},
	});

	mainWindow.loadFile('./renderer/renderer.html');
	if (IS_DEV_MODE) mainWindow.webContents.openDevTools();
}

// IPC-Handler für package.json-Prüfung
ipcMain.handle('check-package-json', (event, projectPath) => {
	const packagePath = path.join(__dirname, projectPath, 'package.json');

	return fs.promises
		.readFile(packagePath, 'utf-8')
		.then((data) => {
			return JSON.parse(data);
		})
		.catch((err) => {
			throw new Error(`Error reading package.json: ${err.message}`);
		});
});
// IPC Handler für server.js - Prüfung
ipcMain.handle('onStartReady', (event, projectPath) => {
	const serverFilePath = path.join(__dirname, projectPath, 'server.js');

	return fs.promises
		.readFile(serverFilePath, 'utf-8')
		.then(() => {
			return serverFilePath;
		})
		.catch((err) => {
			throw new Error(`Error reading server.js: ${err.message}`);
		});
});

// IPC-Handler für das Starten des Node.js-Servers
ipcMain.on('start-server', (event, projectPath) => {
	const serverFile = path.join(projectPath, 'server.js');

	// Führe zuerst 'npm install' aus
	exec('npm install', {cwd: projectPath}, (installError, installStdout, installStderr) => {
		if (installError) {
			mainWindow.webContents.send('server-log', `Error during npm install: ${installError.message}`);
			return;
		}
		if (installStderr) {
			mainWindow.webContents.send('server-log', `npm install stderr: ${installStderr}`);
			return;
		}
		mainWindow.webContents.send('server-log', `npm install completed:\n${installStdout}`);

		try {
			// Wenn npm install erfolgreich ist, starte den Server und überwache stdout/stderr
			const serverProcess = spawn('node', ['server.js'], {cwd: projectPath});
			//
			// Überwache die Standardausgabe (stdout)
			serverProcess.stdout.on('data', (data) => {
				mainWindow.webContents.send('server-log', `Server log: ${data}`);
			});

			// Überwache die Fehlerausgabe (stderr)
			serverProcess.stderr.on('data', (data) => {
				mainWindow.webContents.send('server-log', `Server error: ${data}`);
			});

			// Überwache wenn ein Server stoppt
			serverProcess.on('close', (code) => {
				mainWindow.webContents.send('server-log', `Server stopped with exit code: ${code}`);
			});
			mainWindow.webContents.send('server-log', 'Server is Running CODE GREEN', projectPath, serverProcess.pid);
		} catch (err) {
			mainWindow.webContents.send('server-log', `Server error: ${err}`);
		}
	});
});
// IPc Handler für einen Bestimmten Server zu stoppen
ipcMain.handle('stop-server', async (event, projectPath, PID) => {
	try {
		const serverProcess = exec(`taskkill /PID ${PID} /F`);
	} catch (err) {
		mainWindow.webContents.send('server-log', `Error with process shutdown: ${projectPath} `);
	}
});

// auf application ready statement warten
app.whenReady().then(createWindow);

// wenn user schließt den App Fenster, sollten zuerst alle laufende Server gestoppt sein
app.on('window-all-closed', () => {
	exec('taskkill /F /IM node.exe');

	app.quit();
});
