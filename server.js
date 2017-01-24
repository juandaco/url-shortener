const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

// Home: Instructions for using the app
app.get('/', (req, res) => {
  res.send('Please add at the end of the URL address "/api/whoami/"');
});



app.listen(port);
