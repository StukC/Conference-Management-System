document.addEventListener('DOMContentLoaded', function() {
    loadPapersForReview();
});

document.addEventListener('DOMContentLoaded', function() {
    const viewButtons = document.querySelectorAll('.view-button');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            window.open('test.pdf', '_blank');
        });
    });
});

function loadPapersForReview() {
    fetch('/api/reviewer/papers')
        .then(response => response.json())
        .then(papers => {
            const tableBody = document.getElementById('review-table').querySelector('tbody');
            tableBody.innerHTML = ''; // Clear existing table rows.
            papers.forEach(paper => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${paper.PaperTitle}</td>
                    <td>${paper.ConferenceName}</td>
                    <td>${paper.Status || 'Pending'}</td>
                    <td><button onclick="openReviewModal(${paper.PaperID})">Review</button></td>
                `;
            });
        })
        .catch(error => {
            console.error('Error loading papers for review:', error);
        });
}


function openReviewModal(paperId) {
    // Populate and show the modal for the specific paper
    const modal = document.getElementById('reviewModal');
    document.getElementById('assignmentId').value = paperId;
    modal.style.display = 'block';
}

document.getElementById('reviewForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const paperId = formData.get('assignmentId');

    // Send the review to the server
    fetch(`/api/reviewer/submit-review/${paperId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        alert('Review submitted successfully!');
        document.getElementById('reviewModal').style.display = 'none';
        // Refresh the list of papers
        loadPapersForReview();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting review');
    });
});
