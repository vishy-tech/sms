document.addEventListener('DOMContentLoaded', function() {
    // Fetch and display jobs
    fetchJobs();
    
    // Handle form submission
    document.getElementById('jobForm').addEventListener('submit', function(e) {
        e.preventDefault();
        postJob();
    });

    document.getElementById('ussdMessageForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const message = document.getElementById('ussdMessage').value;
        const statusDiv = document.getElementById('ussdMessageStatus');
        try {
            const res = await fetch('/api/send-ussd-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, target: 'urban' })
            });
            const data = await res.json();
            if (res.ok) {
                statusDiv.textContent = 'Message sent successfully!';
                statusDiv.style.color = 'green';
            } else {
                statusDiv.textContent = data.error || 'Failed to send message.';
                statusDiv.style.color = 'red';
            }
        } catch (err) {
            statusDiv.textContent = 'Error sending message.';
            statusDiv.style.color = 'red';
        }
    });
});

function fetchJobs() {
    fetch('/api/jobs')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#jobsTable tbody');
            tbody.innerHTML = '';
            
            data.forEach(job => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${job.id}</td>
                    <td>${job.title}</td>
                    <td>${job.category}</td>
                    <td>${job.location}</td>
                    <td>${job.salary}</td>
                    <td>KSh ${job.incentive}</td>
                    <td>
                        <button class="action-btn" onclick="deleteJob(${job.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load jobs. Please try again.');
        });
}

function postJob() {
    const job = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        salary: document.getElementById('salary').value,
        incentive: document.getElementById('incentive').value,
        description: document.getElementById('description').value
    };
    
    fetch('/api/jobs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(job)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert('Job posted successfully!');
        document.getElementById('jobForm').reset();
        fetchJobs();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to post job. Please try again.');
    });
}

function deleteJob(id) {
    if (confirm('Are you sure you want to delete this job?')) {
        fetch(`/api/jobs/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(() => {
            alert('Job deleted successfully!');
            fetchJobs();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete job. Please try again.');
        });
    }
}

app.post('/jobs', (req, res) => {
  // handle job posting
});