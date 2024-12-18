const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

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

// Initialize OAuth2 Client
const oAuth2Client = new OAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

// Load tokens and set them in OAuth client
function loadCredentials() {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(tokens);

    // Handle token refresh
    oAuth2Client.on('tokens', (newTokens) => {
      if (newTokens.refresh_token) {
        tokens.refresh_token = newTokens.refresh_token;
      }
      tokens.access_token = newTokens.access_token;
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      console.log('Tokens updated and saved to token.json');
    });
  } else {
    console.log('No token.json found. Please authenticate by visiting /api/auth');
  }
}

module.exports = {
  oAuth2Client,
  loadCredentials,
};
