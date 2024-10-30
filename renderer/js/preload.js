const {contextBridge, ipcRenderer} = require('electron');

// Bereitstellung von APIs für den Renderer-Prozess
contextBridge.exposeInMainWorld('electronAPI', {
	/**
	 * Package Json File Überprüfung
	 * @param {string} projectPath */
	checkPackageJson: (projectPath) => ipcRenderer.invoke('check-package-json', projectPath),
	/**
	 * Server Js File Überprüfung
	 * @param {string} projectPath */
	onStartReady: (projectPath) => ipcRenderer.invoke('onStartReady', projectPath),
	/**
	 * Startet den Server
	 * @param {string} projectPath */
	startServer: (projectPath) => ipcRenderer.send('start-server', projectPath),
	/**
	 * Stoppt bestimmten Server
	 * @param {string} projectPath
	 * @param {number} PID Prozess ID unter dem Windows */
	stopServer: (projectPath, PID) => ipcRenderer.invoke('stop-server', projectPath, PID),
	/**
	 *  Überwacht die Server Logs und übergibt die Protokolldaten an den Callback().
	 * Dies ermöglicht die Anzeige von Server Console Log im Frontend.
	 *
	 * @function onServerLog
	 * @param {function(string, string, number): void} callback  – Die Funktion wird ausgeführt, wenn ein Console Log Event empfangen wird.
	 * – message {String}: Die Protokollnachricht vom Server.
	 * – projectPath {string}: Der Pfad des Projekts mit Web Server
	 * – serverProcessPID {Nummer}: Die Prozess-ID (PID) des Windows Prozesses mit Server.
	 */
	onServerLog: (callback) => ipcRenderer.on('server-log', (event, message, projectPath, serverProcessPID) => callback(message, projectPath, serverProcessPID)),
});
