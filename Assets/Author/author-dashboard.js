document.addEventListener('DOMContentLoaded', function() {
    loadConferences();
    loadMySubmissions();
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

function loadMySubmissions() {
    fetch('/api/my-submissions')
        .then(response => response.json())
        .then(submissions => {
            const submissionsList = document.getElementById('submissions-list');
            submissions.forEach(submission => {
                const div = document.createElement('div');
                div.classList.add('submission');
                // Replace backslashes with forward slashes in the file path
                const filePath = submission.PaperPath.replace(/\\/g, '/');
                div.innerHTML = `
                  <strong>${submission.PaperTitle}</strong> - Authors: ${submission.PaperAuthors}
                  <a href="/${filePath}" target="_blank">View</a>
                  <a href="/${filePath}" download>Download</a>
                `;
                submissionsList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error loading submissions:', error);
        });
}

