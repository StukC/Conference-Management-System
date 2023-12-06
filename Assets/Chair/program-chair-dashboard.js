document.addEventListener('DOMContentLoaded', function() {
    loadReviewProgress();
});

function loadReviewProgress() {
    fetch('/api/chair-review-progress')
        .then(response => response.json())
        .then(papers => {
            const progressList = document.getElementById('review-progress-list');
            papers.forEach(paper => {
                const div = document.createElement('div');
                div.innerHTML = `
                  <strong>Title:</strong> ${paper.PaperTitle}
                  <p><strong>Reviewer 1:</strong> ${paper.Reviewer1} - ${paper.Rec1}</p>
                  <p><strong>Reviewer 2:</strong> ${paper.Reviewer2} - ${paper.Rec2}</p>
                  <p><strong>Reviewer 3:</strong> ${paper.Reviewer3} - ${paper.Rec3}</p>
                  <p><strong>Final Recommendation:</strong> ${paper.FinalRecommendation}</p>
                `;
                progressList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error loading review progress:', error);
        });
}
