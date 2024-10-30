const express = require('express');
const app = express();
const port = 3001;

app.get('/', (req, res) => {
	res.send('Hello im project sample 3 !');
});

app.listen(port, () => {
	console.log(`Example app 1 listening on port ${port}`);
});
