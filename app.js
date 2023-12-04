const express = require('express');
const app = express();
const port = 3000;

// Serve static files from Assets
app.use(express.static('Assets'));

// Root route serving login.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Assets/Login/login.html');
});  

// Additional route (if needed)
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/Assets/Login/login.html');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
