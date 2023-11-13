document.addEventListener('DOMContentLoaded', function() {
    showWelcomeMessage();

    // Add click event to navigation menu items
    var navItems = document.querySelectorAll('nav ul li a');
    navItems.forEach(function(item) {
        item.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior
            alert('Navigating to: ' + event.target.textContent);
            // Here, you can add more complex behavior as needed
        });
    });
});

function showWelcomeMessage() {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + ' ' + time;

    var welcomeMessage = 'Welcome to the Admin Dashboard. Today\'s date is ' + dateTime;
    alert(welcomeMessage);
}
