//
// Renderer für Electron Nodejs Server Shapovalov
// Ein App für ein NodeJS project mit einem Web Server zu starten
//
// nur für WINDOWS OS
//
const upload = document.getElementById('upload');
const output = document.getElementById('output');
const serverList = document.querySelector('#serverList');

let currentIdCount = 0;
const projectsList = ['0'];
let projectPath = '';
///////////////////////////////////////////////////////////////////////////////////////////////////

//User wählt ein Project Pfad
upload.addEventListener('input', (event) => {
	//-wird versucht den ProjectPfad aus DOM auszulesen
	try {
		projectPath = event.target.files[0].webkitRelativePath.slice(0, -event.target.files[0].name.length - 1);
	} catch (err) {
		console.log('Fehler beim holen den Projekt Pfad: ', err);
		output.innerHTML = outputTakeMessage(`<p>Error: ${err}</p>`);
		return;
	}
	//-Überprüfung von Package Json Datei
	window.electronAPI
		.checkPackageJson(projectPath)
		.then((packageJson) => {
			output.innerHTML = outputTakeMessage(`
<div class="text-secondary"><p>Checking package.json<img src="./icons/success.png" alt="success" width="20"></p>
</div>`);
			output.innerHTML = outputTakeMessage(`<p>Dependencies of ${projectPath}:\n${JSON.stringify(packageJson.dependencies, null, 2)}</p>`);
			checkServerJS(); // wenn erfolgreich, zum nächsten Schritt gehen
		})
		.catch((err) => {
			output.innerHTML = outputTakeMessage(`
<div class="text-secondary"><p>Checking package.json<img  src="./icons/fail.png" alt="fail" width="20"></p>
</div>`);
			output.innerHTML = outputTakeMessage(`<p>Error: ${err.message}</p>`);
			return;
		});
});
//-Schritt 2 - überprüfung auf ServerJS Datei
const checkServerJS = () => {
	window.electronAPI
		.onStartReady(projectPath)
		.then((serverFilePath) => {
			//Überprüfen ob es schon auf die Liste ist
			//den array mit die ganzen ProjectsPath hier durchlaufen und den existierten path finden
			const found = projectsList.find((project) => project.name === projectPath);
			if (!found) {
				//nicht gefunden, also zufügen
				const projectObject = {
					id: currentIdCount + 1,
					name: projectPath,
					PID: '',
					projectPath: serverFilePath,
				};
				projectsList.push(projectObject);
				currentIdCount += 1;
				console.log(projectsList);
			} else {
				//gefunden, also es ist schon auf der Liste
				const html = `<p class="text-secondary bg-warning text-dark p-1">der Project ${projectPath} ist schon in der Liste!</p>`;
				output.innerHTML = outputTakeMessage(html);
				return;
			}
			//
			output.innerHTML = outputTakeMessage(`<div class="text-secondary"><p>Checking server.js <img src="./icons/success.png" alt="success" width="20"></p></div>`);
			output.innerHTML = outputTakeMessage(`<p>Ready To Start! You can start this server</p>`);
			// -zum Liste hinzufügen
			//ein neue Element erstellen, EventListeners aufhängen und ins DOM zufügen
			createListElement(projectPath);
		})
		.catch((err) => {
			output.innerHTML = outputTakeMessage(`
<div class="text-secondary"><p>Checking server.js <img  src="./icons/fail.png" alt="fail" width="20"></p>
</div>`);
			output.innerHTML = outputTakeMessage(`<p>Error: ${err.message}</p>`);
		});
};
///////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Start Server Button Funktionalität, es wird über Preload script
 * und anschließend mit Windows OS Task Befehl ausgeführt
 * @param {number} projectId
 */
const startServerBtn = (projectId) => {
	try {
		const project = projectsList.find((project) => project && project.id === projectId);
		// an Preload Script ein event senden
		window.electronAPI.startServer(project.name);
		document.querySelector(`#serverListStartBtn${project.id}`).classList.add('disabled');
		document.querySelector(`#serverListStopBtn${project.id}`).classList.remove('disabled');
	} catch (err) {
		console.log('Fehler beim server start', err);
		const errorHtml = `<p class="text-secondary bg-warning text-dark p-1">Fehler: ${err}</p>`;
		output.innerHTML = outputTakeMessage(errorHtml);
	}
};
/**
 * Stop Server Button Funktionalität, es wird über Preload script
 * und anschließend mit Windows OS Task Befehl ausgeführt
 * @param {number} projectId
 */
const stopServerBtn = (projectId) => {
	try {
		const project = projectsList.find((project) => project && project.id === projectId);
		// an Preload Script senden
		window.electronAPI.stopServer(project.name, project.PID);
		document.querySelector(`#serverListStartBtn${project.id}`).classList.remove('disabled');
		document.querySelector(`#serverListStopBtn${project.id}`).classList.add('disabled');
	} catch (err) {
		console.log(err);
		const errorHtml = `<p class="text-secondary bg-warning text-dark p-1">Fehler: ${err}</p>`;
		output.innerHTML = outputTakeMessage(errorHtml);
	}
};

// Auf Console Log event hören bzw. überwachen
window.electronAPI.onServerLog((message, paramPIDprojectPath, serverProcessPid) => {
	if (message.includes('Server is Running CODE GREEN')) {
		const project = projectsList.find((project) => project.name === paramPIDprojectPath);
		project.PID = serverProcessPid;

		output.innerHTML = outputTakeMessage(`<p class="bg-warning text-dark p-1">Trying to start ${paramPIDprojectPath} ...</p>`);
	} else if (message.includes('Server stopped')) {
		output.innerHTML = outputTakeMessage(`<p class="bg-danger text-light">${message}</p>`);
	} else {
		output.innerHTML = outputTakeMessage(`<p>${message}</p>`);
	}
});

/**
 * Liest aus den aktuelle HTML vom output element und fügt den neuen Eintrag oben drauf
 * @param {string} message
 * @returns aktuellen HTML vom Ausgabe Bereich mit dem neuen Eintrag
 */
const outputTakeMessage = (message) => {
	const html = message + output.innerHTML;
	return html;
};
/**
 * generiert und zufügt ein neues List element mit Start und Stop buttons
 * @param {string} projectPath
 */
const createListElement = (projectPath) => {
	const liEl = document.createElement('li');
	liEl.setAttribute('id', `listEl${currentIdCount}`);
	serverList.querySelectorAll('li').forEach((element) => {
		element.classList.add(`bg-light`, `text-dark`);
	});
	liEl.classList.remove('bg-light', `text-dark`);
	liEl.classList.add('bg-secondary', 'text-light', 'list-group-item', 'd-flex', 'justify-content-between');
	liEl.innerHTML = `
							<span id="projectPathEl${currentIdCount}" class="p-1  font-monospace d-flex align-items-center"> ${projectPath} </span>
							<span id="isRunningEl${currentIdCount}" class="fw-bold">
							
							<div id="serverListStartBtn${currentIdCount}" data-id=${currentIdCount} class="btn btn-primary m-2">Start Server</div>
							<div id="serverListStopBtn${currentIdCount}" data-id=${currentIdCount} class="btn btn-secondary m-2 disabled">Stop Server</div>
							</span>`;
	liEl.addEventListener('click', (event) => {
		serverList.querySelectorAll('li').forEach((element) => {
			element.classList.add(`bg-light`, `text-dark`);
			element.classList.remove('bg-secondary', 'text-light');
		});

		liEl.classList.add('bg-secondary', 'text-light');
		liEl.classList.remove(`bg-light`, `text-dark`);
		console.log('just clicked', event.target);
	});
	serverList.appendChild(liEl);
	output.innerHTML = outputTakeMessage(`<p><span class="text-light bg-success p-1">Der Project ${projectPath} ist zugefügt</span></p>`);
	// start Button zufügen
	document.querySelector(`#serverListStartBtn${currentIdCount}`).addEventListener('click', (event) => {
		const projectId = +event.target.dataset.id;
		startServerBtn(projectId);
	});
	//stop Button zufügen
	document.querySelector(`#serverListStopBtn${currentIdCount}`).addEventListener('click', (event) => {
		const projectId = +event.target.dataset.id;
		stopServerBtn(projectId);
	});
};
