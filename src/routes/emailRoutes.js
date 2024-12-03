const express = require('express');
const emailController = require('../controller/emailController');

const router = express.Router();

// Route to authenticate and fetch tokens
router.get('/auth', emailController.authenticate);

// // Route to handle OAuth2 callback
// router.get('/oauth2callback', emailController.oauth2Callback);

// // Route to fetch the latest email
// router.get('/latest', emailController.fetchLatestEmail);

// Route to update the Grievance status
/**
 * @openapi
 * /api/issue-resolved:
 *   post:
 *     summary: API to update the Grievance status
 *     tags: [Subscription]
 *     description: API to update the Grievance status (pending, resolved).
 *     requestBody:
 *       description: User email, MessageID, status
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               messageID:
 *                 type: string
 *                 description: User's message ID
 *               status:
 *                 type: string
 *                 description: User's Grievance status (pending, resolved).
 *             required:
 *               - email
 *               - messageID
 *               - status
 *     responses:
 *       '200':
 *         description: Grievance status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Status of the email operation (SUCCESS)
 *                 message:
 *                   type: string
 *                   description: A message describing the result email of the Grievance status
 *
 *       '400':
 *         description: Bad request (e.g., missing or invalid parameters)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Status of the operation
 *                 message:
 *                   type: string
 *                   description: A message describing the error
 *
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Status of the operation
 *                 message:
 *                   type: string
 *                   description: A message describing the error
 */
router.get('/issue-resolved', emailController.issueResolved);


module.exports = router;
