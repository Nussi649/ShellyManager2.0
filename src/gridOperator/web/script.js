document.getElementById('fetchForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Example API call (adjust URL and request body as needed)
    const response = await fetch('/api/fetch-specific', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ startDate, endDate })
    });
    
    const data = await response.json();
    console.log(data); // Process and display response data as needed
});