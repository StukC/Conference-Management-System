document.addEventListener('DOMContentLoaded', function() {
    loadPapersNeedingReviewers();
    loadReviewersList();
});

function loadPapersNeedingReviewers() {
    fetch('/api/papers-needing-reviewers')
        .then(response => response.json())
        .then(papers => {
            const tableBody = document.getElementById('papers-table').querySelector('tbody');
            papers.forEach(paper => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${paper.PaperTitle}</td>
                    <td>${paper.Author}</td>
                    <td>${paper.ReviewersAssigned || 'None'}</td>
                    <td>${paper.ReviewProgress}</td>
                    <td>${paper.FinalDecision}</td>
                    <td><button onclick="openAssignReviewersModal(${paper.PaperID})">Assign Reviewers</button></td>
                `;
            });
        })
        .catch(error => {
            console.error('Error loading papers:', error);
        });
}

function loadReviewersList() {
    fetch('/api/reviewers')
        .then(response => response.json())
        .then(reviewers => {
            const dropdowns = ['reviewer1', 'reviewer2', 'reviewer3'];
            dropdowns.forEach(dropdown => {
                const selectElement = document.getElementById(dropdown);
                reviewers.forEach(reviewer => {
                    const option = document.createElement('option');
                    option.value = reviewer.UserID;
                    option.textContent = reviewer.Name;
                    selectElement.appendChild(option);
                });
            });
        })
        .catch(error => {
            console.error('Error loading reviewers:', error);
        });
}

function openAssignReviewersModal(paperId) {
    document.getElementById('selectedPaperId').value = paperId;
    document.getElementById('assignReviewersModal').style.display = 'block';
}

document.getElementById('assignReviewersForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const paperId = document.getElementById('selectedPaperId').value;
    const reviewer1Id = document.getElementById('reviewer1').value;
    const reviewer2Id = document.getElementById('reviewer2').value;
    const reviewer3Id = document.getElementById('reviewer3').value;

    fetch('/api/assign-reviewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, reviewer1Id, reviewer2Id, reviewer3Id })
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error('Network response was not ok.');
    })
    .then(data => {
        alert('Reviewers assigned successfully!');
        document.getElementById('assignReviewersModal').style.display = 'none';
        // Refresh the papers list
        loadPapersNeedingReviewers();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error assigning reviewers');
    });
});
