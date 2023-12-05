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
