const fs = require('fs');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');

const {MailStatus} = require('../config/schema');
// Path to your token.json
// const TOKEN_PATH = 'token.json';

let lastFetchedEmailId = null; // Store the last fetched email ID

// File paths
const TOKEN_PATH = path.join(__dirname, '../../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
// Load credentials
let credentials;
if (fs.existsSync(CREDENTIALS_PATH)) {
  credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
} else {
  throw new Error('Missing credentials.json file!');
}
// OAuth2 client setup
// Initialize OAuth2 Client
const oAuth2Client = new OAuth2Client(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[0]
  );
  

// Load token from file
function loadToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return true;
  }
  return false;
}
// Save new email details to the database
async function saveEmailToDB(messageId, from, subject, body) {
    try {
      const newEmail = new MailStatus({
        messageId,
        from,
        subject,
        body,
        status: 'pending', // Set default status to pending
      });
  
      await newEmail.save();
      console.log(`New email saved to DB with messageId: ${messageId}`);
    } catch (error) {
      console.error('Error saving email to DB:', error);
    }
  }

// Fetch the latest email
async function fetchLatestEmail() {
  if (!loadToken()) {
    console.log('No token found. Please authenticate.');
    return;
  }

  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // List messages with query to only fetch unread messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread', // Adjust this if you want to fetch all emails, not just unread
    });

    if (response.data.messages && response.data.messages.length > 0) {
      const messageId = response.data.messages[0].id; // Latest email ID

      // If the email ID is different from the last fetched one, log it
      if (messageId !== lastFetchedEmailId) {
        lastFetchedEmailId = messageId;
        const emailDetails = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
        });

        // Check if the email is already present in the database
        const existingEmail = await MailStatus.findOne({ messageId });
        if (!existingEmail) {
          const emailSnippet = emailDetails.data.snippet;
          const emailFrom = emailDetails.data.payload.headers.find(header => header.name === 'From');
          const emailSubject = emailDetails.data.payload.headers.find(header => header.name === 'Subject');
          const emailBody = emailSnippet || 'No body content available';
          
          // Logging the message ID, email snippet, From, and Subject
          console.log('New email found:');
          console.log(`Message ID: ${messageId}`);
          const fromEmail = emailFrom ? emailFrom.value.match(/<([^>]+)>/)[1] : 'Unknown';
          console.log(`From: ${fromEmail}`);
          console.log(`Subject: ${emailSubject ? emailSubject.value : 'No Subject'}`);
          console.log(`Email Content (Snippet): ${emailSnippet}`);

          // Save email details to DB
          await saveEmailToDB(messageId, emailFrom ? fromEmail : 'Unknown', emailSubject ? emailSubject.value : 'No Subject', emailBody);
        } else {
          console.log('Email already exists in the database.');
        }
      } else {
        console.log('No new email.');
      }
    } else {
      console.log('No new emails.');
    }
  } catch (err) {
    console.error('Error fetching emails:', err);
  }
}

// Polling for new emails at a fixed interval (e.g., every 20 seconds)
function startEmailPolling() {
  console.log('Starting email polling...');
  setInterval(fetchLatestEmail, 10000); // Poll every 60 seconds
}

module.exports = { startEmailPolling };
