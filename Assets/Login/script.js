document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var errorMessage = document.getElementById('error-message');

    // Simulate login validation
    if (username === "admin" && password === "password") {
        // This is where you would normally handle a successful login,
        // perhaps redirecting the user to their dashboard.
        errorMessage.textContent = ""; // Clear any error messages.
        window.location.href = '/dashboard.html'; // Redirect to the dashboard page.
    } else {
        // If credentials are invalid, display an error message.
        errorMessage.textContent = "Invalid username or password!";
    }
});
