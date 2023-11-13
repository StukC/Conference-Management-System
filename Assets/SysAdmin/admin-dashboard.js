document.addEventListener('DOMContentLoaded', function() {
    showWelcomeMessage();
    // Any other code needed for the dashboard
});

// Or, if you just remove the event.preventDefault() line
document.addEventListener('DOMContentLoaded', function() {
    showWelcomeMessage();

    var navItems = document.querySelectorAll('nav ul li a');
    navItems.forEach(function(item) {
        item.addEventListener('click', function(event) {
            alert('Navigating to: ' + event.target.textContent);
            // No event.preventDefault(), so the default navigation will occur
        });
    });
});
