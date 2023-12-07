const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const multer = require('multer');
const session = require('express-session');
const app = express();
const port = 3000;

// Updated multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Preserve file extension
  }
});

const upload = multer({ storage: storage });

// MySQL Connection Pool Setup
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'stukc', // SQL Username
  password: 'pass', // MySQL password
  database: 'project' // Schema name
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Serve static files from the 'Assets' directory
app.use(express.static('Assets'));

// Use the path module for cross-platform compatibility
const path = require('path');

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

      // Convert userTitle to lowercase (or uppercase) for consistent comparison
      const userTitle = results[0].Title.toLowerCase(); // or .toUpperCase()

      // Redirect based on user's title
      switch (userTitle) {
        case 'admin':
          res.redirect('/SysAdmin/admin-dashboard.html');
          break;
        case 'reviewer':
          res.redirect('/Reviewer/reviewer-dashboard.html');
          break;
        case 'author':
          res.redirect('/Author/author-dashboard.html');
          break;
        case 'chair':
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

// Fetch user's paper submissions
app.get('/api/my-submissions', (req, res) => {
  if (!req.session.user) {
    return res.status(403).send('Not logged in');
  }

  const userId = req.session.user.id;

  pool.query('SELECT PaperID, PaperTitle, PaperAuthors, PaperPath, OriginalFilename FROM papers WHERE UserID = ?', [userId], (error, results) => {
    if (error) {
      console.error('Error fetching user submissions:', error);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Set headers for PDF content type
  res.setHeader('Content-Type', 'application/pdf');

  // append .pdf to ensure correct extension
  res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Server error');
    }
  });
});

//submit-paper endpoint
app.post('/submit-paper', upload.single('paper'), (req, res) => {
  if (!req.session.user) {
    return res.status(403).send('Not logged in');
  }

  const userId = req.session.user.id;
  const paperTitle = req.body.paperTitle;
  const paperAuthors = req.body.paperAuthors;
  const paperPath = req.file.path;
  const originalFilename = req.file.originalname; // Get the original file name

  const insertQuery = 'INSERT INTO papers (PaperTitle, PaperAuthors, PaperPath, OriginalFilename, UserID) VALUES (?, ?, ?, ?, ?)';
  pool.query(insertQuery, [paperTitle, paperAuthors, paperPath, originalFilename, userId], (error, results) => {
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

// Endpoint to fetch all conference details
app.get('/api/reviewer/conferences', (req, res) => {
  pool.query('SELECT * FROM conferences', (error, results) => {
      if (error) {
          console.error('Error fetching conferences:', error);
          return res.status(500).send('Server error');
      }
      res.json(results);
  });
});

// Endpoint to fetch all papers including final recommendation
app.get('/api/reviewer/papers', (req, res) => {
  pool.query('SELECT * FROM papers', (error, results) => {
      if (error) {
          console.error('Error fetching papers:', error);
          return res.status(500).send('Server error');
      }
      res.json(results);
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
