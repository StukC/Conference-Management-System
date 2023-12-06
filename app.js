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

  // Suggest a default filename when saving (e.g., "downloaded.pdf")
  // We append .pdf to ensure the file is saved with the correct extension
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

app.get('/api/chair-review-progress', async (req, res) => {
  if (!req.session.user || req.session.user.title !== 'Chair') {
    return res.status(403).send('Access denied');
  }

  try {
    const papersQuery = `
      SELECT p.PaperID, p.PaperTitle, 
             r1.Name as Reviewer1, r1.Recommendation as Rec1,
             r2.Name as Reviewer2, r2.Recommendation as Rec2,
             r3.Name as Reviewer3, r3.Recommendation as Rec3
      FROM papers p
      LEFT JOIN reviews r1 ON p.Review1ID = r1.ReviewID
      LEFT JOIN reviews r2 ON p.Review2ID = r2.ReviewID
      LEFT JOIN reviews r3 ON p.Review3ID = r3.ReviewID
      WHERE p.ConferenceID = ?`;

    const papers = await pool.promise().query(papersQuery, [req.session.user.conferenceId]);
    const papersWithRecommendation = papers[0].map(paper => {
      // Logic to calculate automatic recommendation
      const recs = [paper.Rec1, paper.Rec2, paper.Rec3];
      const publishCount = recs.filter(r => r === 'Accept').length;
      const rejectCount = recs.filter(r => r === 'Reject' || r === 'Neutral').length;
      
      paper.FinalRecommendation = 'Pending';
      if (publishCount === 3) {
        paper.FinalRecommendation = 'Publish';
      } else if (rejectCount >= 2) {
        paper.FinalRecommendation = 'Do Not Publish';
      }

      return paper;
    });

    res.json(papersWithRecommendation);
  } catch (error) {
    console.error('Error fetching review progress:', error);
    res.status(500).send('Server error');
  }
});

// Fetch papers assigned to the logged-in reviewer
app.get('/api/reviewer/assigned-papers', (req, res) => {
  if (!req.session.user || req.session.user.title !== 'Reviewer') {
      return res.status(403).send('Access denied');
  }

  const reviewerId = req.session.user.id;
  pool.query('SELECT p.PaperTitle, c.ConferenceName, a.AssignmentID FROM assignments a INNER JOIN papers p ON a.PaperID = p.PaperID INNER JOIN conferences c ON p.ConferenceID = c.ConferenceID WHERE a.ReviewerID = ?', [reviewerId], (error, results) => {
      if (error) {
          console.error('Error fetching assigned papers:', error);
          return res.status(500).send('Server error');
      }
      res.json(results);
  });
});


// Endpoint for reviewers to submit reviews
app.post('/api/reviewer/submit-review', (req, res) => {
  if (!req.session.user || req.session.user.title !== 'Reviewer') {
      return res.status(403).send('Access denied');
  }

  const { assignmentId, recommendation, comments } = req.body;
  const reviewQuery = 'INSERT INTO reviews (AssignmentID, Recommendation, Comments) VALUES (?, ?, ?)';
  pool.query(reviewQuery, [assignmentId, recommendation, comments], (error, results) => {
      if (error) {
          console.error('Error submitting review:', error);
          return res.status(500).send('Server error');
      }
      res.send('Review submitted successfully');
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
