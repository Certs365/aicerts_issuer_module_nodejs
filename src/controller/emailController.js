// Load environment variables from .env file
require('dotenv').config();
const { validationResult } = require('express-validator');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { oAuth2Client, loadCredentials } = require('../config/googleAuth');
const messageCode = require('../common/codes'); // Common message codes for API responses
const { MailStatus } = require('../config/schema');

loadCredentials(); // Load saved credentials on server start

const {
    sendResolvedEmail
  } = require('../models/emails');

/**
 * Authenticate with Gmail and generate an authorization URL.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const authenticate = async (req, res) => {
    try {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/gmail.readonly'],
            prompt: 'consent',
        });

        return res.status(200).json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgOperationSuccess,
            data: { authUrl },
        });
    } catch (error) {
        console.error('Error during authentication:', error);
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
        });
    }
};

/**
 * Handle OAuth2 callback and store tokens.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const oauth2Callback = async (req, res) => {
    const { code } = req.query;

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Save tokens to token.json
        const TOKEN_PATH = path.join(__dirname, '../../token.json');
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

        console.log('Tokens saved to token.json:', tokens);
        return res.status(200).json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgOperationSuccess,
        });
    } catch (error) {
        console.error('Error during OAuth2 callback:', error);
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
        });
    }
};

/**
 * Fetch the latest unread email.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const fetchLatestEmail = async (req, res) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 1,
            q: 'is:unread',
        });

        const messages = response.data.messages || [];
        if (messages.length === 0) {
            return res.status(200).json({
                code: 200,
                status: 'SUCCESS',
                message: messageCode.msgNoEmailsFound,
                data: null,
            });
        }

        const messageId = messages[0].id;
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
        });

        const payload = message.data.payload;
        const headers = payload.headers;
        const subject = headers.find((header) => header.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((header) => header.name === 'From')?.value || 'Unknown Sender';
        const snippet = message.data.snippet || 'No preview available';

        return res.status(200).json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgOperationSuccess,
            data: {
                messageId,
                subject,
                from,
                snippet,
            },
        });
    } catch (error) {
        console.error('Error fetching latest email:', error);
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
        });
    }
};

/**
 * To push resolved email to the issuer.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const issueResolved = async (req, res) => {
    try {
        const { email, messageId, status} = req.body;
        const messageID = await MailStatus.findOne({ messageId });        

        if (!messageID) {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgInvalidMessageId,
            });
        }
        // update the status to 'resolved'
        await MailStatus.updateOne({ messageId }, { $set: { status } });

        // send email to user , regarding the issue resolution
        await sendResolvedEmail(email);

        return res.status(200).json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgEmailSuccess,
        });

    } catch (error) {
        console.error('Error updating details:', error);
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
        });
    }
};

module.exports = {
    authenticate,
    oauth2Callback,
    fetchLatestEmail,
    issueResolved,
};
