function loadAssignedPapers() {
    fetch('/api/reviewer/assigned-papers')
        .then(response => response.json())
        .then(papers => {
            const reviewTableBody = document.getElementById('review-table').querySelector('tbody');
            papers.forEach(paper => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${paper.PaperTitle}</td>
                    <td>${paper.ConferenceName}</td>
                    <td><button onclick="openReviewModal(${paper.AssignmentID})">Review</button></td>
                `;
                reviewTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading assigned papers:', error);
        });
}

function openReviewModal(assignmentId) {
    // Set the assignmentId in the hidden field
    document.getElementById('assignmentId').value = assignmentId;

    // Show the modal
    document.getElementById('reviewModal').style.display = 'block';
}

document.getElementById('reviewForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    fetch('/api/reviewer/submit-review', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        alert('Review submitted successfully!');
        document.getElementById('reviewModal').style.display = 'none';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting review');
    });
});
