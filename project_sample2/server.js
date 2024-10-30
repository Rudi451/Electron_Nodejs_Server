const express = require('express');
const app = express();
const port = 3002;

app.get('/', (req, res) => {
	res.send('Hello im project sample 2 !');
});
app.get('/dorthin', (req, res) => {
	res.send('Das ist eine Dorthin Route von sample 2 !');
});

app.listen(port, () => {
	console.log(`Example app 2 listening on port ${port}`);
	console.log(`Verfügbare Route: localhost:${port}/dorthin`);
});
