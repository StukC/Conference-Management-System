document.addEventListener('DOMContentLoaded', function() {
    var conferenceForm = document.getElementById('conferenceForm');

    conferenceForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting in the default way

        // Collecting form data
        var formData = {
            conferenceName: document.getElementById('conferenceName').value,
            conferenceLocation: document.getElementById('conferenceLocation').value,
            conferenceStartDate: document.getElementById('conferenceStartDate').value,
            conferenceEndDate: document.getElementById('conferenceEndDate').value,
            paperSubmissionDeadline: document.getElementById('paperSubmissionDeadline').value,
            chairEmail: document.getElementById('chairEmail').value,
            chairFirstName: document.getElementById('chairFirstName').value,
            chairLastName: document.getElementById('chairLastName').value,
            chairTitle: document.getElementById('chairTitle').value,
            chairAffiliation: document.getElementById('chairAffiliation').value
        };

        console.log(formData); // For demonstration, we'll just log the data to the console

        // Here you would typically send the formData to the server

        alert('Conference entry created successfully!'); // Placeholder feedback
    });
});
