const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
	res.send('Hello im project sample 1 !');
});
app.get('/hier', (req, res) => {
	res.send('Das ist eine Hier Route !');
});

app.listen(port, () => {
	console.log(`Example app 1 listening on port ${port}`);
	console.log(`Verfügbare Route: localhost:${port}/hier`);
});
