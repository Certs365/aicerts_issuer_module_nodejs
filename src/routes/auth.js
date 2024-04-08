const express = require('express');
const router = express.Router();
const tasksController = require('../controller/auth');



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
 * /api/login:
 *   post:
 *     summary: User Login
 *     tags: [Login]
 *     description: Logs in a user with the provided email and password.
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
/**
 * @swagger
 * /api/login-with-phone:
 *   post:
 *     summary: Login with phone number using two-factor authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: The ID token obtained from the user during two-factor authentication.
 *               email:
 *                 type: string
 *                 description: The email address of the user for two-factor authentication.
 *             required:
 *               - idToken
 *               - email
 *     responses:
 *       200:
 *         description: Successful login with valid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 message:
 *                   type: string
 *                   example: Valid User Credentials
 *                 data:
 *                   type: object
 *                   properties:
 *                     JWTToken:
 *                       type: string
 *                       example: <JWT_TOKEN>
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     organization:
 *                       type: string
 *                       example: ABC Corporation
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     phoneNumber:
 *                       type: string
 *                       example: +1234567890
 *       401:
 *         description: Invalid OTP or expired token
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
 *                   example: Invalid OTP or expired token
 *       404:
 *         description: User not found
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
 *                   example: User not found
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
 *                   example: Internal Server Error. Please try again later.
 */

router.post('/two-factor-auth', tasksController.twoFactor);

module.exports=router;