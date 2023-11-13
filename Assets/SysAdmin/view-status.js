document.addEventListener('DOMContentLoaded', function() {
    // Simulate fetching system status data
    function fetchSystemStatus() {
        return [
            { component: 'Database', status: 'Operational' },
            { component: 'Web Server', status: 'Operational' },
            // Add more components as needed
        ];
    }

    function updateSystemStatus() {
        const statusData = fetchSystemStatus();
        const tableBody = document.querySelector('table tbody');

        tableBody.innerHTML = ''; // Clear existing rows

        statusData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${item.component}</td><td>${item.status}</td>`;
            tableBody.appendChild(row);
        });
    }

    // Initial update
    updateSystemStatus();

    // Refresh system status every 5 minutes (300000 milliseconds)
    setInterval(updateSystemStatus, 300000);
});
