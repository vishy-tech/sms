require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const africastalking = require('africastalking')({
    apiKey: process.env.AT_API_KEY, // Set this in your .env file
    username: process.env.AT_USERNAME // Set this in your .env file
});
const sms = africastalking.SMS;
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for testing
let jobs = [
    { id: 1, title: 'Farm Worker', category: 'Agriculture', location: 'Nairobi', salary: '500/day', incentive: 50 },
    { id: 2, title: 'Construction Helper', category: 'Construction', location: 'Mombasa', salary: '600/day', incentive: 50 },
    { id: 3, title: 'House Cleaner', category: 'Domestic', location: 'Kisumu', salary: '400/day', incentive: 50 }
];

let applications = [];
let payments = [];

// Logging middleware
app.use((req, res, next) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        params: req.params,
        body: req.body
    };
    
    console.log(logEntry);
    fs.appendFileSync(path.join(logsDir, 'server.log'), JSON.stringify(logEntry) + '\n');
    next();
});

// Complete USSD Handler
app.post('/ussd', (req, res) => {
    const { sessionId, phoneNumber, text } = req.body;
    
    let response = '';
    let textArray = text.split('*');
    let level = textArray.length;
    let userInput = textArray[level - 1];
    
    // Main menu
    if (level === 1 && text === '') {
        response = `CON Welcome to Youth Job Board
1. Browse Jobs
2. Apply for Job
3. Check Application Status
4. Claim Incentive
5. Help`;
    }
    // Browse Jobs
    else if (textArray[0] === '1') {
        if (level === 2) {
            response = `CON Browse Jobs By:
1. Category
2. Location
0. Back`;
        }
        // Category selection
        else if (textArray[1] === '1' && level === 3) {
            response = `CON Select Category:
1. Agriculture
2. Construction
3. Domestic
0. Back`;
        }
        // Display jobs by category
        else if (textArray[1] === '1' && level === 4) {
            if (userInput === '0') {
                response = `CON Welcome to Youth Job Board
1. Browse Jobs
2. Apply for Job
3. Check Application Status
4. Claim Incentive
5. Help`;
            } else {
                const categories = ['Agriculture', 'Construction', 'Domestic'];
                const selectedCategory = categories[parseInt(userInput) - 1];
                const categoryJobs = jobs.filter(job => job.category === selectedCategory);
                
                if (categoryJobs.length === 0) {
                    response = `END No jobs available in ${selectedCategory} category.`;
                } else {
                    let jobList = categoryJobs.map(job => 
                        `${job.id}. ${job.title} (${job.location}, ${job.salary})`
                    ).join('\n');
                    response = `CON ${selectedCategory} Jobs:\n${jobList}\n0. Back`;
                }
            }
        }
        // Location selection
        else if (textArray[1] === '2' && level === 3) {
            response = `CON Select Location Radius:
1. Within 5km
2. Within 10km
0. Back`;
        }
        // Display jobs by location
        else if (textArray[1] === '2' && level === 4) {
            if (userInput === '0') {
                response = `CON Welcome to Youth Job Board
1. Browse Jobs
2. Apply for Job
3. Check Application Status
4. Claim Incentive
5. Help`;
            } else {
                const locations = ['Nairobi', 'Mombasa', 'Kisumu']; // Simplified for testing
                const locationJobs = jobs.filter(job => locations.includes(job.location));
                
                if (locationJobs.length === 0) {
                    response = `END No jobs available in your area.`;
                } else {
                    let jobList = locationJobs.map(job => 
                        `${job.id}. ${job.title} (${job.category}, ${job.salary})`
                    ).join('\n');
                    response = `CON Nearby Jobs:\n${jobList}\n0. Back`;
                }
            }
        }
    }
    // Apply for Job
    else if (textArray[0] === '2') {
        if (level === 2) {
            response = `CON Enter Job ID to apply:`;
        } else if (level === 3) {
            const jobId = parseInt(userInput);
            const job = jobs.find(j => j.id === jobId);
            
            if (job) {
                applications.push({
                    jobId,
                    phoneNumber,
                    status: 'pending',
                    incentivePaid: false,
                    appliedAt: new Date()
                });
                
                response = `END Thank you! Application submitted for ${job.title}. You'll receive KSh ${job.incentive} incentive after verification.`;
            } else {
                response = `END Invalid Job ID. Please try again.`;
            }
        }
    }
    // Check Application Status
    else if (textArray[0] === '3') {
        const userApplications = applications.filter(app => app.phoneNumber === phoneNumber);
        
        if (userApplications.length === 0) {
            response = `END You have no job applications.`;
        } else {
            let statusList = userApplications.map(app => {
                const job = jobs.find(j => j.id === app.jobId);
                return `${job ? job.title : 'Unknown Job'}: ${app.status}`;
            }).join('\n');
            
            response = `END Your Applications:\n${statusList}`;
        }
    }
    // Claim Incentive
    else if (textArray[0] === '4') {
        const eligibleApps = applications.filter(app => 
            app.phoneNumber === phoneNumber && 
            app.status === 'approved' && 
            !app.incentivePaid
        );
        
        if (eligibleApps.length === 0) {
            response = `END No incentives available to claim.`;
        } else {
            const totalIncentive = eligibleApps.reduce((sum, app) => {
                const job = jobs.find(j => j.id === app.jobId);
                return sum + (job ? job.incentive : 0);
            }, 0);
            
            // Mark as paid
            eligibleApps.forEach(app => app.incentivePaid = true);
            
            // Simulate payment
            payments.push({
                phoneNumber,
                amount: totalIncentive,
                reference: `INC-${Date.now()}`,
                status: 'success',
                createdAt: new Date()
            });
            
            response = `END Your incentive of KSh ${totalIncentive} has been processed. You should receive an M-PESA confirmation shortly.`;
        }
    }
    // Help
    else if (textArray[0] === '5') {
        response = `END For assistance, call 0700123456 or visit our office. Thank you for using Youth Job Board.`;
    }
    // Invalid option
    else {
        response = `END Invalid option. Please try again.`;
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(response);
});

// Mock M-PESA Integration Endpoint
app.post('/mpesa-callback', (req, res) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'mpesa_callback',
        data: req.body
    };
    
    console.log('M-PESA Callback:', logEntry);
    fs.appendFileSync(path.join(logsDir, 'server.log'), JSON.stringify(logEntry) + '\n');
    
    res.status(200).json({ 
        ResultCode: 0, 
        ResultDesc: "Success", 
        ThirdPartyTransID: `MPE${Date.now()}` 
    });
});

// API Endpoints for Admin Panel
app.get('/api/jobs', (req, res) => {
    res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
    const newJob = {
        id: jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 1,
        title: req.body.title,
        category: req.body.category,
        location: req.body.location,
        salary: req.body.salary,
        incentive: req.body.incentive || 50,
        createdAt: new Date()
    };
    
    jobs.push(newJob);
    res.json(newJob);
});

app.delete('/api/jobs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    jobs = jobs.filter(job => job.id !== id);
    res.json({ message: 'Job deleted successfully' });
});

app.get('/ussd', (req, res) => {
  res.send('USSD endpoint is working!');
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    fs.appendFileSync(path.join(logsDir, 'error.log'), `${new Date().toISOString()} - ${err.stack}\n`);
    res.status(500).send('Something broke!');
});

// Example: List of rural users' phone numbers (replace with your real data source)
const RuralUsers = [
    '+254700111222',
    '+254700333444'
];

app.post('/api/send-ussd-message', (req, res) => {
    const { message, target } = req.body;
    // For demo: just log the message and pretend to send to urban users
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    // Here you would integrate with your SMS/USSD gateway
    console.log(`USSD message to ${target} users: ${message}`);
    res.json({ success: true });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Test USSD endpoint: POST http://localhost:${port}/ussd`);
    console.log(`Admin panel: http://localhost:${port}/admin`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Server shutting down');
    process.exit();
});