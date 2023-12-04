const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

// Set up your database connection
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'stukc', // your MySQL username
  password: 'password', // your MySQL password
  database: 'project' // your schema name
});

// Function to update the password
async function updatePassword(username, newPassword) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  pool.query('UPDATE users SET Password = ? WHERE Username = ?', [hashedPassword, username], (error, results) => {
    if (error) {
      console.error('Error updating password:', error);
      process.exit(1); // Exit with an error code
    } else {
      console.log(`Password updated for user: ${username}`);
      process.exit(0); // Exit with success code
    }
  });
}

// Call the function with your username and the new password
updatePassword('stukc', 'password'); // Replace 'password' with the actual password you want to hash
