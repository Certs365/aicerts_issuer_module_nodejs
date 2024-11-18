const express = require('express');
const validationRoute = require("../common/validationRoutes");
const router = express.Router();
const userController = require('../controller/subscribe');
const { decryptRequestBody } = require('../utils/authUtils');

/**
 * @swagger
 * /api/get-subscription-plans:
 *   post:
 *     summary: API to get selected / all subscritpion plans in DB by valid email and planCode (optional). 
 *     description: API to get selected / all subscritpion plans in DB by valid email and planCode (optional). 
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Enter valid email.
 *               planCode:
 *                 type: string
 *                 description: The valid (unique) plan code.
 *             required:
 *               - email
 *     responses:
 *       '200':
 *         description: Successfully fetched the subscription plan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Subscription plan details."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to get subscription plan"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.post('/get-subscription-plans', validationRoute.emailCheck, userController.getSubscriptionPlans);

/**
 * @swagger
 * /api/add-subscription-plan:
 *   post:
 *     summary: API to set details of the new subscritpion plan in DB by admin email. 
 *     description: API to set details of the new subscritpion plan in DB by admin email, code (plan code), title, subheader, fee, limit, rate, validity.
 *     tags: [Subscription]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email associated with the admin.
 *               code:
 *                 type: string
 *                 description: The valid (unique) plan code.
 *               title:
 *                 type: string
 *                 description: The valid (unique) plan title.
 *               subheader:
 *                 type: string
 *                 description: The sub header (unique) of the plan.
 *               fee:
 *                 type: number
 *                 description: The fee of the plan.
 *               limit:
 *                 type: number
 *                 description: The limit (credits) of the plan.
 *               rate:
 *                 type: string
 *                 description: The rate (for each credit value) of the plan.
 *               validity:
 *                 type: number
 *                 description: The validity (in days) of the plan.
 *             required:
 *               - email
 *               - code
 *               - title
 *               - subheader
 *               - fee
 *               - limit
 *               - rate
 *               - validity
 *     responses:
 *       '200':
 *         description: Successfully created the subscription plan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Subscription plan created successfully."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to create the subscription plan"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.post('/add-subscription-plan', decryptRequestBody, validationRoute.emailCheck, userController.addSubscriptionPlan);

/**
 * @swagger
 * /api/update-subscription-plan:
 *   post:
 *     summary: API to update details of the existing subscritpion plan in DB by admin email. 
 *     description: API to updaet details of the new subscritpion plan in DB by admin email, code (plan code), title, subheader, fee, limit, rate, validity.
 *     tags: [Subscription]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email associated with the admin.
 *               code:
 *                 type: string
 *                 description: Code of the subscription plan to be updated.
 *             required:
 *               - email
 *               - code
 *     responses:
 *       '200':
 *         description: Successfully updated the subscription plan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Subscription plan updated successfully."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to create the subscription plan"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.post('/update-subscription-plan', decryptRequestBody, validationRoute.emailCheck, userController.updateSubscriptionPlan);

/**
 * @swagger
 * /api/delete-subscription-plan:
 *   delete:
 *     summary: API to delete the details of an existing subscritpion plan in DB by admin email, and code. 
 *     description: API to delete the details of an existing subscritpion plan in DB by admin email, and code. 
 *     tags: [Subscription]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email associated with the admin.
 *               code:
 *                 type: string
 *                 description: The valid (unique) plan code.
 *             required:
 *               - email
 *               - code
 *     responses:
 *       '200':
 *         description: Successfully deleted the subscription plan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Subscription plan deleted successfully."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to delete the subscription plan"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.delete('/delete-subscription-plan', decryptRequestBody, validationRoute.emailCheck, userController.deleteSubscriptionPlan);

/**
 * @swagger
 * /api/add-user-subscription-plan:
 *   post:
 *     summary: API to allocate details of the existing subscritpion plan to an issuer in DB by issuer email and plan code. 
 *     description: API to allocate details of the existing subscritpion plan to an issuer in DB by issuer email and plan code. 
 *     tags: [Subscription]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email associated with the issuer.
 *               code:
 *                 type: string
 *                 description: The valid (unique) plan code.
 *             required:
 *               - email
 *               - code
 *     responses:
 *       '200':
 *         description: Successfully added the subscription plan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Subscription plan added to the issuer successfully."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to add the subscription plan"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.post('/add-user-subscription-plan', decryptRequestBody, validationRoute.emailCheck, userController.addUserSubscriptionPlan);

/**
 * @swagger
 * /api/add-enterprise-subscription-plan:
 *   post:
 *     summary: API to add / update details of the enterprise subscritpion plan to an issuer (specific) in DB by issuer email and custom plan details. 
 *     description: API to add / update details of the enterprise subscritpion plan to an issuer (specific) in DB by issuer email, plan title, plan duration and credits. 
 *     tags: [Subscription]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email associated with the issuer.
 *               subscriptionPlanTitle:
 *                 type: string
 *                 description: The valid enterprise subscription plan title.
 *               subscriptionDuration:
 *                 type: number
 *                 description: The valid enterprise subscription plan duration (in days).
 *               allocatedCredentials:
 *                 type: number
 *                 description: The valid enterprise subscription plan credits.
 *             required:
 *               - email
 *               - subscriptionPlanTitle
 *               - subscriptionDuration
 *               - allocatedCredentials
 *     responses:
 *       '200':
 *         description: Successfully added the subscription plan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Subscription plan added to the issuer successfully."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to add the subscription plan"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.post('/add-enterprise-subscription-plan', decryptRequestBody, validationRoute.emailCheck, userController.addEnterpriseSubscriptionPlan);

/**
 * @swagger
 * /api/fetch-user-subscription-details:
 *   post:
 *     summary: API to get active subscritpion plans in DB by valid issuer email. 
 *     description: API to get active subscritpion plans in DB by valid issuer email. 
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Enter valid email.
 *             required:
 *               - email
 *     responses:
 *       '200':
 *         description: Successfully fetched the subscription plan (active) details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Subscription plan details."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to get subscription plan"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.post('/fetch-user-subscription-details', validationRoute.emailCheck, userController.getIssuerSubscriptionDetails);

// /**
//  * @swagger
//  * /api/create-checkout-session:
//  *   post:
//  *     summary: API to perform checkout valid email and planCode (optional). 
//  *     description: API to get selected / all subscritpion plans in DB by valid email and planCode (optional). 
//  *     tags: [Subscription]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 description: Enter valid email.
//  *               planCode:
//  *                 type: string
//  *                 description: The valid (unique) plan code.
//  *             required:
//  *               - email
//  *     responses:
//  *       '200':
//  *         description: Successfully fetched the subscription plan.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *             example:
//  *               code: 200
//  *               status: "SUCCESS"
//  *               message: "Subscription plan details."
//  *       '400':
//  *         description: Invalid request due to missing or invalid parameters.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *             example:
//  *               code: 400
//  *               status: "FAILED"
//  *               message: "Unable to get subscription plan"
//  *
//  *       '401':
//  *         description: Unauthorized (e.g., invalid credentials)
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 status:
//  *                   type: string
//  *                 message:
//  *                   type: string
//  *             example:
//  *               code: 401.
//  *               status: "FAILED"
//  *               message: Invalid / unauthorized token
//  *       '422':
//  *         description: User given invalid input (Unprocessable Entity)
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 status:
//  *                   type: string
//  *                 message:
//  *                   type: string
//  *             example:
//  *               code: 422.
//  *               status: "FAILED"
//  *               message: Error message for invalid input.
//  *       '500':
//  *         description: Internal Server Error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 status:
//  *                   type: string
//  *                 message:
//  *                   type: string
//  *             example:
//  *               code: 500
//  *               status: "FAILED"
//  *               message: "Internal Server Error."
//  */
router.post('/create-checkout-session', decryptRequestBody, validationRoute.emailCheck, userController.createCheckoutSession);

/**
 * @swagger
 * /api/checkout-grievance:
 *   post:
 *     summary: API to send grievance request to admin with email & payment ID. 
 *     description: API to send grievance request to admin with email & payment ID.
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email associated with the issuer.
 *               paymentID:
 *                 type: string
 *                 description: Provide vaid paymentID.
 *             required:
 *               - email
 *               - paymentID
 *     responses:
 *       '200':
 *         description: Successfully placed grievance request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Successfully placed grievance request."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to create grievance request"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.post('/checkout-grievance', validationRoute.emailCheck, userController.createGrievance);

/**
 * @swagger
 * /api/validate-transaction:
 *   post:
 *     summary: API to validate payment transaction with email and session ID. 
 *     description: API to validate payment transaction with email and session ID.
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email associated with the issuer (valid).
 *               sessionId:
 *                 type: string
 *                 description: The valid (unique) plan code.
 *             required:
 *               - email
 *               - sessionId
 *     responses:
 *       '200':
 *         description: Session retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Session retrieved successfully."
 *       '400':
 *         description: Invalid request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 400
 *               status: "FAILED"
 *               message: "Unable to retrieve the session"
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
 *                 message:
 *                   type: string
 *             example:
 *               code: 401.
 *               status: "FAILED"
 *               message: Invalid / unauthorized token
 *       '422':
 *         description: User given invalid input (Unprocessable Entity)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 422.
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               code: 500
 *               status: "FAILED"
 *               message: "Internal Server Error."
 */
router.post('/validate-transaction', userController.fetchPaymentDetails);

// https://api.stripe.com/v1/checkout/sessions/cs_test_a1ORqbWqFat7zyZIuRJlLUv46D5kQFOrAvaMEA7hwFNeCTNtJef5h1cGdN

module.exports = router;
