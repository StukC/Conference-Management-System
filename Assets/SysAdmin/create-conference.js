document.addEventListener('DOMContentLoaded', function() {
    var conferenceForm = document.getElementById('conferenceForm');

    conferenceForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting in the default way

        // Collecting form data
        var formData = {
            conferenceName: document.getElementById('conferenceName').value,
            city: document.getElementById('conferenceCity').value,
            state: document.getElementById('conferenceState').value,
            country: document.getElementById('conferenceCountry').value,
            startDate: document.getElementById('conferenceStartDate').value,
            endDate: document.getElementById('conferenceEndDate').value,
            submissionDeadline: document.getElementById('paperSubmissionDeadline').value,
            chairEmail: document.getElementById('chairEmail').value,
            chairFirst: document.getElementById('chairFirstName').value,
            chairLast: document.getElementById('chairLastName').value,
            chairTitle: document.getElementById('chairTitle').value,
            chairAffiliation: document.getElementById('chairAffiliation').value
        };

        // AJAX request to send data to server
        fetch('/api/conferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if(response.ok) {
                return response.text();
            } else {
                throw new Error('Server responded with an error!');
            }
        })
        .then(data => {
            console.log('Success:', data);
            alert('Conference entry created successfully!');
            window.location.href = '/SysAdmin/admin-dashboard.html'; // Redirect to admin dashboard
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error creating conference');
        });
});
});