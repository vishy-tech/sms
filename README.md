USSD Job Board with SMS Integration - Complete Documentation
Table of Contents
System Overview

Setup Instructions

Running the Application

Using the Admin Panel

Sending SMS Messages

API Endpoints

Troubleshooting

Next Steps

System Overview
This application provides:

USSD interface for rural users to browse and apply for jobs

Web admin panel for job management

SMS messaging capability to contact urban users

Incentive system for job applications

Setup Instructions
Prerequisites
Node.js (v14 or higher)

npm (comes with Node.js)

Internet connection

Installation Steps
Download the project files to your computer

Open a terminal/command prompt and navigate to the project folder:

bash
cd path/to/project-folder
Install dependencies:

bash
npm install
Create environment file:

Create a new file named .env in the project root

Add these contents:

env
PORT=3000
BASE_URL=http://localhost:3000
Running the Application
Start the server with:

bash
npm start
You should see:

text
Server running on port 3000
Test USSD endpoint: POST http://localhost:3000/ussd
Admin panel: http://localhost:3000/admin
Using the Admin Panel
Access the admin panel:
Open your browser and visit:

text
http://localhost:3000/admin
Posting a Job:

Fill in all fields in the "Post New Job" form

Click "Post Job"

Verify the job appears in the Job Listings table

Sending SMS Messages:

Go to the "Send USSD Message" section

Enter a valid Kenyan phone number (format: +2547XXXXXXXX)

Type your message (160 characters max)

Click "Send Message"

Check the status message below the form

Sending SMS Messages
Message Requirements
Phone numbers must be in Kenyan format (+254 followed by 9 digits)

Messages are limited to 160 characters

The system shows remaining character count as you type

Testing SMS Functionality
The system currently uses mock SMS sending (logs to console)

To test with real SMS:

Sign up with an SMS provider (like Africa's Talking)

Add API credentials to .env

Uncomment the real SMS code in server.js

API Endpoints
Endpoint	Method	Description	Parameters
/ussd	POST	Handle USSD requests	sessionId, phoneNumber, text
/api/jobs	GET	Get all jobs	-
/api/jobs	POST	Create new job	title, category, location, description, salary, incentive
/api/jobs/:id	DELETE	Delete job	id in URL
/api/send-sms	POST	Send SMS	phoneNumber, message
/api/sent-messages	GET	Get sent messages	-
Troubleshooting
Common Issues
npm start not working:

Ensure you're in the correct directory with package.json

Verify package.json has the "start" script:

json
"scripts": {
  "start": "node server.js"
}
Admin panel not loading:

Check the server is running (npm start)

Verify no errors in terminal

Try hard refresh in browser (Ctrl+F5)

SMS not sending:

Check console for errors

Verify phone number format (+2547XXXXXXXX)

For real SMS: ensure API credentials are correct

Checking Logs
Application logs: logs/server.log

Error logs: logs/error.log

Next Steps
Database Integration:

Replace in-memory storage with MongoDB/PostgreSQL

Add persistence for jobs and messages

Real SMS Gateway:

Sign up with Africa's Talking or other provider

Add credentials to .env:

env
AT_API_KEY=your_api_key
AT_USERNAME=your_username
AT_SENDER_ID=your_sender_id
Authentication:

Add login to admin panel

Secure API endpoints

Deployment:

Deploy to cloud platform (AWS, DigitalOcean)

Set up production environment variables
