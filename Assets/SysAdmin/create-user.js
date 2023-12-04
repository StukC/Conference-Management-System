document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userCreationForm');
    form.onsubmit = function(event) {
        event.preventDefault(); // Prevent the default form submission
        createUser();
    };
});

function createUser() {
    const form = document.getElementById('userCreationForm');
    const formData = {
        firstName: form.elements['firstName'].value,
        lastName: form.elements['lastName'].value,
        username: form.elements['username'].value,
        email: form.elements['email'].value,
        password: form.elements['password'].value,
        role: form.elements['role'].value
    };

    fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.text();
    })
    .then(data => {
        alert('User created successfully');
        form.reset(); // Clear the form
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while creating the user: ' + error.message);
    });
}
