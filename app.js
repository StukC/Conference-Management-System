const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const session = require('express-session');
const app = express();
const port = 3000;

// MySQL Connection Pool Setup
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'stukc', // Replace with your MySQL username
  password: 'pass', // Replace with your MySQL password
  database: 'project' // Replace with your schema name
});

// Middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware for parsing application/json
app.use(bodyParser.json());

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret', // Use an environment variable
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in a production environment with HTTPS
}));

// Serve static files from the 'Assets' directory
app.use(express.static('Assets'));

// Root route serving login.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Assets/Login/login.html');
});

// Login endpoint
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

      // User authenticated, establish a session
      req.session.user = {
        id: results[0].UserID,
        username: username,
        title: results[0].Title
      };

      // Redirect based on user's title
      const userTitle = results[0].Title;
      switch (userTitle) {
        case 'Admin':
          res.redirect('/SysAdmin/admin-dashboard.html');
          break;
        case 'Reviewer':
          res.redirect('/Reviewer/reviewer-dashboard.html');
          break;
        case 'author':
          res.redirect('/Author/author-dashboard.html');
          break;
        case 'Chair':
          res.redirect('/Chair/program-chair-dashboard.html');
          break;
        default:
          res.send('No appropriate dashboard found for user.');
      }      
    } catch (bcryptError) {
      console.error('Error comparing passwords:', bcryptError);
      res.status(500).send('Server error during password comparison');
    }
  });
});

//fetch users
app.get('/api/users', (req, res) => {
  pool.query('SELECT Username, Email, Title as Role FROM users', (error, results) => {
      if (error) {
          console.error('Error fetching users:', error);
          return res.status(500).send('Server error');
      }
      res.json(results);
  });
});

app.post('/submit-paper', upload.single('paper'), (req, res) => {
  const paperTitle = req.body.paperTitle; // Ensure this matches the name attribute in your HTML form
  const paperAuthors = req.body.paperAuthors; // Ensure this matches the name attribute in your HTML form
  const paperPath = req.file.path; // Path where the uploaded file is saved

  // SQL to insert paper data into the Papers table
  const insertQuery = 'INSERT INTO papers (PaperTitle, PaperAuthors, PaperPath) VALUES (?, ?, ?)';
  pool.query(insertQuery, [paperTitle, paperAuthors, paperPath], (error, results) => {
      if (error) {
          console.error('Error submitting paper:', error);
          return res.status(500).send('Error submitting paper');
      }
      res.send('Paper submitted successfully');
  });
});

// Add User
app.post('/api/users', async (req, res) => {
  const { username, email, firstName, lastName, role, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 8); // Hash the password

  pool.query('INSERT INTO users (FirstName, LastName, Username, Email, Title, Password) VALUES (?, ?, ?, ?, ?, ?)',
             [firstName, lastName, username, email, role, hashedPassword], 
             (error, results) => {
      if (error) {
          console.error('Error adding user:', error);
          return res.status(500).send('Server error');
      }
      res.status(201).send('User added successfully');
  });
});

// Fetch specific user details
app.get('/api/users/:username', (req, res) => {
  const username = req.params.username;
  pool.query('SELECT Username, Email, Title FROM users WHERE Username = ?', [username], (error, results) => {
      if (error) {
          console.error('Error fetching user:', error);
          return res.status(500).send('Server error');
      }
      if (results.length === 0) {
          return res.status(404).send('User not found');
      }
      res.json(results[0]);
  });
});


// Edit User
app.put('/api/users/:username', (req, res) => {
  const { email, role } = req.body;
  const username = req.params.username;

  pool.query('UPDATE users SET Email = ?, Title = ? WHERE Username = ?',
             [email, role, username],
             (error, results) => {
      if (error) {
          console.error('Error updating user:', error);
          return res.status(500).send('Server error');
      }
      if (results.affectedRows === 0) {
          return res.status(404).send('User not found');
      }
      res.send('User updated successfully');
  });
});

// Update user
app.put('/api/users/:username', async (req, res) => {
  const username = req.params.username;
  const { email, title } = req.body;
  // Add necessary fields and validation as required
  pool.query('UPDATE users SET Email = ?, Title = ? WHERE Username = ?', [email, title, username], (error, results) => {
      if (error) {
          console.error('Error updating user:', error);
          return res.status(500).send('Server error');
      }
      if (results.affectedRows === 0) {
          return res.status(404).send('User not found');
      }
      res.send('User updated successfully');
  });
});

// Delete User
app.delete('/api/users/:username', (req, res) => {
  const username = req.params.username;

  pool.query('DELETE FROM users WHERE Username = ?', [username], (error, results) => {
      if (error) {
          console.error('Error deleting user:', error);
          return res.status(500).send('Server error');
      }
      if (results.affectedRows === 0) {
          return res.status(404).send('User not found');
      }
      res.send('User deleted successfully');
  });
});

// Fetch all conferences
app.get('/api/conferences', (req, res) => {
  pool.query('SELECT ConferenceID, ConferenceName FROM Conferences', (error, results) => {
      if (error) {
          console.error('Error fetching conferences:', error);
          return res.status(500).send('Server error');
      }
      res.json(results);
  });
});

//conferences endpoint
app.post('/api/conferences', async (req, res) => {
  const { conferenceName, city, state, country, startDate, endDate, submissionDeadline, chairEmail, chairFirst, chairLast, chairTitle, chairAffiliation } = req.body;

  // Validate data here

  const username = chairEmail; // Using email as username
  const password = 'generatedPassword'; // Generate or obtain a password
  const hashedPassword = await bcrypt.hash(password, 8); // Hash the password

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection:', err);
      return res.status(500).send('Server error');
    }

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        console.error('Error starting transaction:', err);
        return res.status(500).send('Server error');
      }

      // Insert into conferences table
      const conferenceQuery = 'INSERT INTO conferences (ConferenceName, City, State, Country, StartDate, EndDate, SubmissionDeadline, ChairEmail, ChairFirst, ChairLast, ChairTitle, ChairAffiliation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      connection.query(conferenceQuery, [conferenceName, city, state, country, startDate, endDate, submissionDeadline, chairEmail, chairFirst, chairLast, chairTitle, chairAffiliation], (error, results) => {
        if (error) {
          return connection.rollback(() => {
            connection.release();
            console.error('Error inserting conference:', error);
            return res.status(500).send('Server error');
          });
        }

        // Insert into users table
        const userQuery = 'INSERT INTO users (Email, FirstName, LastName, Title, Username, Password) VALUES (?, ?, ?, ?, ?, ?)';
        connection.query(userQuery, [chairEmail, chairFirst, chairLast, chairTitle, username, hashedPassword], (error, results) => {
          if (error) {
            return connection.rollback(() => {
              connection.release();
              console.error('Error inserting user:', error);
              return res.status(500).send('Server error');
            });
          }

          // Commit transaction
          connection.commit(err => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error('Error committing transaction:', err);
                return res.status(500).send('Server error');
              });
            }

            connection.release();
            res.send('Conference and user added successfully');
          });
        });
      });
    });
  });
});


// Logout endpoint
app.get('/logout', (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if(err) {
          console.error('Error destroying session:', err);
          return res.status(500).send('Could not log out, server error');
      }
      res.redirect('/Login/login.html'); // Redirect to login page after logout
    });
  } else {
    res.redirect('/Login/login.html'); // If no session, directly redirect
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
