const express = require('express');
const emailController = require('../controller/emailController');

const router = express.Router();

// Route to authenticate and fetch tokens
router.get('/auth', emailController.authenticate);

// // Route to handle OAuth2 callback
// router.get('/oauth2callback', emailController.oauth2Callback);

// // Route to fetch the latest email
// router.get('/latest', emailController.fetchLatestEmail);

// Route to update the status
router.get('/issue-resolved', emailController.issueResolved);


module.exports = router;
