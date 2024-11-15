const express = require('express');
const validationRoute = require("../common/validationRoutes");
const router = express.Router();
const userController = require('../controller/subscribe');
const { decryptRequestBody } = require('../utils/authUtils');

//? set all subscription plan, one time thing
/**
 * @swagger
 * /api/put-all-plans:
 *   post:
 *     summary: API to generate the Excel report as per Issuer provided Start date and End date. 
 *     description: API to generate the Excel report as per Issuer provided Start date and End date, Example Date 09/20/2024 or 2024-09-20T23:59:59.999Z. 
 *     tags: [Report/Invoice]
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
 *               startDate:
 *                 type: string
 *                 description: The valid start date in (MM/DD/YYYY) format.
 *               endDate:
 *                 type: string
 *                 description: The valid end date in (MM/DD/YYYY) format.
 *             required:
 *               - email
 *               - startDate
 *               - endDate
 *     responses:
 *       '200':
 *         description: Successfully generated the report.
 *         content:
 *           application/excel:
 *             schema:
 *               type: string
 *               format: binary
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "Report saved successfully."
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
 *               message: "Unable to fetch/generate report"
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
router.post('/put-all-plans', validationRoute.emailCheck , userController.updateSubscriptionPlan);

// ! DONT RUN, JUST FOR TESTING
router.delete('/set-all-plans', userController.deleteSubscriptionPlans);

// get all subscription plan
router.get('/get-all-plans', validationRoute.emailCheck, userController.getSubscriptionPlans);  //todo=> why it works even im not passing email

// get users , current subscription plan details       // TODO - > Should add authorization middleware too?

router.post('/get-subscription-details', validationRoute.emailCheck, userController.getIssuerSubscriptionDetails);

// store individual users subscription details         //    TODO - > Should add authorization middleware too?

router.post('/add-subscription-details', validationRoute.emailCheck, userController.addSubscriptionPlans);

// for Add / Update Enterprise subscription plan
router.post('/add-enterprise-subscription-plan', validationRoute.emailCheck, userController.addEnterpriseSubscriptionPlan);

// for fetch Enterprise subscription plan
router.post('/fetch-enterprise-subscription-plan', validationRoute.emailCheck, userController.fetchEnterpriseSubscriptionPlan);

// Grievance api
router.post('/checkout-grievance', validationRoute.emailCheck, userController.createGrievance);

// stripe api for payment
router.post('/create-checkout-session', validationRoute.emailCheck, userController.createCheckoutSession);

// stripe api for payment deatils
router.get('/checkout-session/:sessionId', userController.fetchPaymentDetails);

// todo-> add verify payment id, use nodefetch , 
// https://api.stripe.com/v1/checkout/sessions/cs_test_a1ORqbWqFat7zyZIuRJlLUv46D5kQFOrAvaMEA7hwFNeCTNtJef5h1cGdN

module.exports = router;
