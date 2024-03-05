const express = require('express');
const router = express.Router();
const tasksController = require('../controller/controller');

/**
 * @openapi
 * /api/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Signup]
 *     description: Create a new user account with the provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               organization:
 *                 type: string
 *                 description: User's organization
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password (at least 8 characters long)
 *               address:
 *                 type: string
 *                 description: User's address (optional)
 *               country:
 *                 type: string
 *                 description: User's country (optional)
 *               organizationType:
 *                 type: string
 *                 description: User's organization type (optional)
 *               city:
 *                 type: string
 *                 description: User's city (optional)
 *               zip:
 *                 type: string
 *                 description: User's ZIP code (optional)
 *               industrySector:
 *                 type: string
 *                 description: User's industry sector (optional)
 *               state:
 *                 type: string
 *                 description: User's state (optional)
 *               websiteLink:
 *                 type: string
 *                 description: User's website link (optional)
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number (optional)
 *               designation:
 *                 type: string
 *                 description: User's designation (optional)
 *               username:
 *                 type: string
 *                 description: User's username (optional)
 *             required:
 *               - name
 *               - organization
 *               - email
 *               - password
 *     responses:
 *       '200':
 *         description: Successful user registration
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
 *                   description: Information about the registered user
 *
 *       '400':
 *         description: Bad request (e.g., empty input fields, invalid email, short password)
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


router.post('/signup', tasksController.signup);
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

router.post('/update-issuer', tasksController.updateIssuer);

/**
 * @openapi
 * /api/login:
 *   post:
 *     summary: User Login
 *     tags: [Login]
 *     description: |
 *       Logs in a user with the provided email and password. Generates and sends an OTP for verification.
 *
 *     requestBody:
 *       description: User email and password
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
 *                 description: User's password
 *
 *     responses:
 *       '200':
 *         description: Login successful, OTP sent for verification
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
 *       '401':
 *         description: Unauthorized (e.g., invalid credentials)
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

router.post('/login', tasksController.login);

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

router.post('/forgot-password', tasksController.forgotPassword);

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

router.post('/reset-password', tasksController.resetPassword);

/**
 * @swagger
 * /api/verify-issuer:
 *   post:
 *     summary: Verify issuer with email and code
 *     tags: [2 Factor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               code:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: PASSED
 *                 message:
 *                   type: string
 *                   example: Verification successful
 *       400:
 *         description: Bad Request - Invalid email or code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: FAILED
 *                 message:
 *                   type: string
 *                   example: Verification failed
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: FAILED
 *                 message:
 *                   type: string
 *                   example: An error occurred during the verification
 */

router.post('/verify-issuer', tasksController.verifyIssuer);

/**
 * @swagger
 * /api/two-factor-auth:
 *   post:
 *     summary: Generate and send code to email
 *     tags: [2 Factor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user for two-factor authentication.
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Two-factor authentication code sent successfully
 *         content:
 *           application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      status:
 *                          type: string
 *                          example: SUCCESS
 *                      message:
 *                          type: string
 *                          example: OTP sent to the email
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      status:
 *                          type: string
 *                          example: FAILED
 *                      message:
 *                          type: string
 *                          example: User not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: FAILED
 *                 message:
 *                   type: string
 *                   example: An error occurred during the verification
 */
router.post('/login-with-phone', tasksController.loginPhoneNumber);
router.post('/two-factor-auth', tasksController.twoFactor);


module.exports=router;