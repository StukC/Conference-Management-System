document.addEventListener('DOMContentLoaded', function() {
    loadConferences();
});

function loadConferences() {
    fetch('/api/conferences')
        .then(response => response.json())
        .then(conferences => {
            const dropdown = document.getElementById('conferenceDropdown');
            conferences.forEach(conference => {
                const option = document.createElement('option');
                option.value = conference.ConferenceID;
                option.textContent = conference.ConferenceName;
                dropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading conferences:', error);
        });
}

document.getElementById('paper-submission-form').addEventListener('submit', function(event) {
    event.preventDefault();

    var formData = new FormData(this);
    fetch('/submit-paper', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        alert('Paper submitted successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting paper');
    });
});
