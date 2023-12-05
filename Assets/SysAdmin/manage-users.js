document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    document.getElementById('addUserBtn').addEventListener('click', showAddUserForm);
    // You might need to add event listeners for form submissions or other buttons here
});

function loadUsers() {
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            populateUserTable(data);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            alert('Failed to load users. Please try again later.');
        });
}

function populateUserTable(users) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = user.Username;
        row.insertCell().textContent = user.Email;
        row.insertCell().textContent = user.Role;
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => editUser(user.Username);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteUser(user.Username);

        const actionsCell = row.insertCell();
        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
    });
}

function showAddUserForm() {
    document.getElementById('userForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Add User';
    document.getElementById('formType').value = 'add';
}

function editUser(username) {
    // Fetch user details and populate the form
    fetch(`/api/users/${username}`)
        .then(response => response.json())
        .then(user => {
            document.getElementById('userForm').style.display = 'block';
            document.getElementById('formTitle').textContent = 'Edit User';
            document.getElementById('formType').value = 'edit';
            document.getElementById('username').value = user.Username;
            document.getElementById('email').value = user.Email;
            document.getElementById('role').value = user.Role;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to fetch user details.');
        });
}

function submitUserForm() {
    const formType = document.getElementById('formType').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;
    const url = formType === 'edit' ? `/api/users/${username}` : '/api/users';
    const method = formType === 'edit' ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, role }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        alert(data);
        loadUsers();
        document.getElementById('userForm').style.display = 'none';
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while saving the user.');
    });
}

function deleteUser(username) {
    if (confirm(`Are you sure you want to delete the user ${username}?`)) {
        fetch(`/api/users/${username}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            alert(data);
            loadUsers();
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred while deleting the user.');
        });
    }
}

document.getElementById('userFormElement').onsubmit = function(event) {
    event.preventDefault();
    submitUserForm();
};
