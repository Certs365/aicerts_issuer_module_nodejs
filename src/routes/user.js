const express = require('express');
const router = express.Router();
const userController = require('../controller/user');

/**
 * @openapi
 * /api/update-issuer:
 *   post:
 *     summary: Update specific fields of an existing issuer
 *     tags: [Issuer]
 *     description: Update specific fields of an existing issuer identified by the provided ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the issuer to update.
 *               name:
 *                 type: string
 *                 description: Updated user's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated user's email address
 *               phoneNumber:
 *                 type: string
 *                 description: Updated user's phone number
 *             required:
 *               - id
 *     responses:
 *       '200':
 *         description: Successful update of issuer
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
 *                   description: A message describing the result of the operation
 *                 data:
 *                   type: object
 *                   description: Information about the updated issuer
 *       '400':
 *         description: Bad request (e.g., issuer not found, invalid input)
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

router.post('/update-issuer', userController.updateIssuer);

/**
 * @openapi
 * /api/forgot-password:
 *   post:
 *     summary: Forgot Password
 *     tags: [Forgot Password]
 *     description: |
 *       Initiates the password reset process by sending an OTP to the user's email.
 *
 *     requestBody:
 *       description: User email
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
 *
 *     responses:
 *       '200':
 *         description: Password reset initiated successfully
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
 *                   description: A message describing the result of the operation
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

router.post('/forgot-password', userController.forgotPassword);


/**
 * @openapi
 * /api/reset-password:
 *   post:
 *     summary: Reset Password
 *     tags: [Reset Password]
 *     description: |
 *       Resets the user's password with the provided email and new password.
 *
 *     requestBody:
 *       description: User email and new password
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
 *               password:
 *                 type: string
 *                 description: New password for the user
 *
 *     responses:
 *       '200':
 *         description: Password reset successful
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
 *                   description: A message describing the result of the operation
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

router.post('/reset-password', userController.resetPassword);


module.exports=router;