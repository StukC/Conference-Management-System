const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// MySQL Connection Pool Setup
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'stukc', // Replace with your MySQL username
  password: 'password', // Replace with your MySQL password
  database: 'project' // Replace with your schema name
});

// Middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware for parsing application/json
app.use(bodyParser.json());

// Serve static files from the 'Assets' directory
app.use(express.static('Assets'));

// Root route serving login.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Assets/Login/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query the database for the user
  pool.query('SELECT * FROM users WHERE Username = ?', [username], async (error, results, fields) => {
    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).send('Server error');
    }

    if (results.length === 0) {
      return res.status(401).send('Username does not exist');
    }

    // Compare the hashed password
    try {
      const isMatch = await bcrypt.compare(password, results[0].Password);
      if (!isMatch) {
        return res.status(401).send('Password is incorrect');
      }

      // User authenticated, check user's title
      const userTitle = results[0].Title;
      switch (userTitle) {
        case 'Admin':
          res.redirect('/SysAdmin/admin-dashboard.html');
          break;
        case 'Reviewer':
          res.redirect('/Reviewer/reviewer-dashboard.html'); 
          break;
        case 'Author':
          res.redirect('/Author/author-dashboard.html'); 
          break;
        case 'Chair':
          res.redirect('/Chair/program-chair-dashboard.html'); 
          break;
        default:
          res.send('NA.');
      }      
    } catch (bcryptError) {
      console.error('Error comparing passwords:', bcryptError);
      res.status(500).send('Server error during password comparison');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
