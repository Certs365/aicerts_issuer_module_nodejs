// Load environment variables from .env file
require('dotenv').config();

const { validationResult } = require("express-validator");
const moment = require('moment');

// Import MongoDB models
const { Admin, User, SubscriptionPlan, UserSubscriptionPlan } = require("../config/schema");

const messageCode = require("../common/codes");

// Importing functions from a custom module
const {
    isDBConnected, // Function to check if the database connection is established
    sendGrievanceMail,
} = require('../models/tasks'); // Importing functions from the '../model/tasks' module

// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);

/**
 * API call to set details of the new subscritpion plan in DB by email.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const addSubscriptionPlan = async (req, res) => {
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    const { email, code, title, subheader, fee, limit, rate, validity } = req.body;

    try {
        // Check mongoose connection
        await isDBConnected();

        const adminExist = await Admin.findOne({ email: email });
        if (!adminExist || !adminExist.email) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidEmail, details: email });
        }

        const planExist = await SubscriptionPlan.findOne({ code: code });
        if (planExist) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgPlanCodeExist, details: code });
        }

        // const fee = limit * rate;
        const today = new Date();

        const subscriptionDetails = new SubscriptionPlan({
            code,
            title,
            subheader,
            fee,
            limit,
            rate,
            validity,
            lastUpdate: today
        });
        const savePlan = await subscriptionDetails.save();

        return res.status(200).json({
            code: 200,
            status: "SUCCESS",
            message: messageCode.msgOperationSuccess,
            data: savePlan
        });


    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError
        });
    }
};

/**
 * API call for update details of existing subscriptin plan.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateSubscriptionPlan = async (req, res) => {
    var validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    const email = req.body.email;
    const code = req.body.code;
    const updateFields = req.body;
    try {
        await isDBConnected();
        const isAdmin = await Admin.findOne({ email: email });
        if (!isAdmin) {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgAdminMailNotExist,
            });
        }
        const isCodeExist = await SubscriptionPlan.findOne({ code: code });
        if (!isCodeExist) {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgPlanNotFound,
            });
        }

        // Update specific fields
        for (const key in updateFields) {
            if (Object.hasOwnProperty.call(updateFields, key)) {
                isCodeExist[key] = updateFields[key];
            }
        }
        // Save the updated issuer
        const subscriptionPlan = await isCodeExist.save();
        if (subscriptionPlan) {
            return res.status(200).json({
                code: 200,
                status: 'SUCCESS',
                message: messageCode.msgPlanAddedSuccess,
                details: isCodeExist
            });
        } else {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgPlanNotAdded,
            });
        }
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
        });
    }
};

/**
 * API call for deletion of selective or all plan for ui.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteSubscriptionPlan = async (req, res) => {
    var validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    const email = req.body.email;
    const planCode = req.body.code;
    if (!email || !planCode || planCode == "string") {
        return res.status(400).json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInvalidInput
        });
    }
    try {
        await isDBConnected();
        const isAdmin = await Admin.findOne({ email: email });
        if (!isAdmin) {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgAdminMailNotExist,
            });
        }

        const isPlanExist = await SubscriptionPlan.findOne({ code: planCode });
        if (!isPlanExist) {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgPlanNotFound,
            });
        }
        await SubscriptionPlan.deleteOne({ code: planCode });
        return res.status(200).json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgPlanDeleted,
            details: isPlanExist
        });

    } catch (error) {
        res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
        });
    }
};

/**
 * API call to fetch details of selected / all subscription plans.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getSubscriptionPlans = async (req, res) => {
    const email = req.body.email;
    const planCode = req.body.planCode;
    if (!email) {
        return res.status(400).json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInvalidInput
        });
    }
    try {
        await isDBConnected();
        if (planCode && planCode != "string") {
            const getPlan = await SubscriptionPlan.findOne({ code: planCode });
            if (getPlan) {
                return res.status(200).json({
                    code: 200,
                    status: 'SUCCESS',
                    message: messageCode.msgPlanDetailsFetched,
                    details: getPlan
                });
            } else {
                return res.status(400).json({
                    code: 400,
                    status: 'FAILED',
                    message: messageCode.msgPlanNotFound,
                    details: planCode
                });
            }
        }
        const allPlans = await SubscriptionPlan.find({ status: true }).lean();
        // const allPlans = await SubscriptionPlan.find({ }).lean();
        res.status(200).json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgPlanDetailsFetched,
            details: allPlans
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
        });
    }
};

/**
 * API call to set details of users current subscritpion plan (admin) in DB by email.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const addUserSubscriptionPlan = async (req, res) => {
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }

    const { email, code } = req.body;

    try {
        // Check mongoose connection
        await isDBConnected();

        const issuerExist = await User.findOne({ email: email });
        if (!issuerExist) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidIssuer, details: email });
        }

        const isPlanExist = await SubscriptionPlan.findOne({ code: code });
        if (!isPlanExist) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgPlanNotFound, details: code });
        }

        const issuerId = issuerExist.issuerId;
        const todayDate = new Date();

        const isUserPlanExist = await UserSubscriptionPlan.findOne({ email: email });
        if (isUserPlanExist) {
            isUserPlanExist.subscriptionPlanTitle.push(isPlanExist?.title);
            isUserPlanExist.purchasedDate.push(todayDate);
            isUserPlanExist.subscriptionFee.push(isPlanExist?.fee);
            isUserPlanExist.subscriptionDuration.push(isPlanExist?.validity);
            isUserPlanExist.allocatedCredentials.push(isPlanExist?.limit);
            // Get the last item in the currentCredentials array
            const lastCurrentCredential = isUserPlanExist.currentCredentials.at(-1) || 0;
            isUserPlanExist.currentCredentials.push(lastCurrentCredential + isPlanExist?.limit);

            await isUserPlanExist.save();
            return res.status(200).json({
                code: 200,
                status: "SUCCESS",
                message: messageCode.msgPlanAddedSuccess,
                data: isUserPlanExist
            });

        } else {

            const subscriptionPlanDetails = new UserSubscriptionPlan({
                email: email,
                issuerId: issuerId,
                subscriptionPlanTitle: [isPlanExist?.title],
                purchasedDate: [todayDate],
                subscriptionFee: [isPlanExist?.fee],
                subscriptionDuration: [isPlanExist?.validity],
                allocatedCredentials: [isPlanExist?.limit],
                currentCredentials: [isPlanExist?.limit],
            });
            const savePlan = await subscriptionPlanDetails.save();

            return res.status(200).json({
                code: 200,
                status: "SUCCESS",
                message: messageCode.msgPlanAddedSuccess,
                data: subscriptionPlanDetails
            });
        }

    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError
        });
    }
};

/**
 * API call to add details of an enterprise plan.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const addEnterpriseSubscriptionPlan = async (req, res) => {
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    const todayDate = new Date();
    const { email, subscriptionPlanTitle, subscriptionDuration, allocatedCredentials } = req.body;

    if (!email, !subscriptionPlanTitle, !subscriptionDuration, !allocatedCredentials) {
        return res.status(400).json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInvalidInput
        });
    }
    try {
        // Check mongoose connection
        await isDBConnected();

        const issuerExist = await User.findOne({ email: email });
        if (!issuerExist) {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgInvalidIssuer,
                details: email
            });
        }

        //todo=> amount is hardcoded as of now, please make it dynamic as per user inputs
        const subscriptionFee = 5 * allocatedCredentials;

        const isUserPlanExist = await UserSubscriptionPlan.findOne({ email: email });

        if (isUserPlanExist) {
            isUserPlanExist.subscriptionPlanTitle.push(subscriptionPlanTitle);
            isUserPlanExist.purchasedDate.push(todayDate);
            isUserPlanExist.subscriptionDuration.push(subscriptionDuration);
            isUserPlanExist.subscriptionFee.push(subscriptionFee);
            isUserPlanExist.allocatedCredentials.push(allocatedCredentials);
            // Get the last item in the currentCredentials array
            const lastCurrentCredential = isUserPlanExist.currentCredentials.at(-1) || 0;
            isUserPlanExist.currentCredentials.push(lastCurrentCredential + allocatedCredentials);

            await isUserPlanExist.save();

            return res.status(200).json({
                code: 200,
                status: "SUCCESS",
                message: messageCode.msgPlanAddedSuccess,
                data: isUserPlanExist
            });
        } else {
            const subscriptionDetails = new UserSubscriptionPlan({
                email: email,
                issuerId: issuerExist.issuerId,
                subscriptionPlanTitle: [subscriptionPlanTitle],
                purchasedDates: [todayDate], // Initialize with an array
                subscriptionFee: [subscriptionFee], // Initialize with an array
                subscriptionDurations: [subscriptionDuration], // Initialize with an array
                allocatedCredentials: [allocatedCredentials], // Initialize with an array
                currentCredentials: [allocatedCredentials], // Initialize with an array
            });
            const savePlan = await subscriptionDetails.save();

            return res.status(200).json({
                code: 200,
                status: "SUCCESS",
                message: messageCode.msgPlanAddedSuccess,
                data: subscriptionDetails
            });
        }

    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError
        });
    }
};

/**
 * API call to get current plan details ans check if credits are insufficient or expiration date passed
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getIssuerSubscriptionDetails = async (req, res) => {
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    try {
        // Check mongoose connection
        await isDBConnected();

        const email = req.body.email;

        // const issuerExist = await User.findOne({ email: email });

        // if (!issuerExist) {
        //     return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidIssuer, details: email });
        // }

        const subscriptionDetails = await UserSubscriptionPlan.findOne({ email: email });

        //!  msgMatchLimitsNotFound, msgMatchLimitsFound -> no message init, need to fix
        // Get the plan details
        if (!subscriptionDetails) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgPlanNotFound, details: email });
        }

        // Get the latest details (last element of each array)
        const latestDetails = {
            subscriptionPlanTitle: subscriptionDetails.subscriptionPlanTitle.at(-1),
            purchasedDate: subscriptionDetails.purchasedDate.at(-1),
            subscriptionFee: subscriptionDetails.subscriptionFee.at(-1),
            subscriptionDuration: subscriptionDetails.subscriptionDuration.at(-1),
            allocatedCredentials: subscriptionDetails.allocatedCredentials.at(-1),
            currentCredentials: subscriptionDetails.currentCredentials.at(-1),
        };
        // check for expiring  in 5 day or less

        function normalizeDate(date) {
            return new Date(date.setHours(0, 0, 0, 0));
        }
        const today = normalizeDate(new Date());
        const purchaseDate = normalizeDate(new Date(latestDetails.purchasedDate));
        const expireDate = normalizeDate(new Date(purchaseDate.setDate(purchaseDate.getDate() + latestDetails.subscriptionDuration)));
        const diffTime = today > expireDate ? 0 : expireDate - today;
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        // console.log("expireDate", expireDate);
        // console.log("purchase date", purchaseDate);
        // console.log("diffDays", diffDays);

        if (diffDays <= 5 && diffDays > 0) {
            return res.status(200).json({
                code: 200,
                status: "SUCCESS",
                message: messageCode.msgLimitAboutToExhaust,
                details: latestDetails,
                remainingDays: diffDays,
                // planHistory: subscriptionDetails
            });
        } else if (diffDays <= 0) {

            if (subscriptionDetails.subscriptionDuration.at(-1) != 0) {
                // latestDetails.status = false;
                subscriptionDetails.subscriptionPlanTitle.push("Free");
                subscriptionDetails.purchasedDate.push(new Date());
                subscriptionDetails.subscriptionDuration.push(0);
                subscriptionDetails.subscriptionFee.push(0);
                subscriptionDetails.allocatedCredentials.push(50);
                subscriptionDetails.currentCredentials.push(50);

                await subscriptionDetails.save();
            }

            return res.status(200).json({
                code: 200,
                status: "SUCCESS",
                message: messageCode.msgLimitExhausted,
                details: subscriptionDetails,
                remainingDays: diffDays,
                // planHistory: subscriptionDetails
            });
        } else {
            return res.status(200).json({
                code: 200,
                status: "SUCCESS",
                message: messageCode.msgPlanDetailsFetched,
                details: latestDetails,
                // planHistory: subscriptionDetails
            });
        }

    } catch (error) {
        console.log("Error", error);
        res.json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgErrorOnFetching
        });
    }
};

/**
 * API call to approach grevience cell with email and transaction ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createGrievance = async (req, res) => {
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    try {
        const { email, paymentID } = req.body;
        const report = {
            email,
            paymentID
        };

        if (!email || !paymentID || paymentID == "string") {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgEnterInvalid, details: report });
        }

        await sendGrievanceMail(email, paymentID);

        res.status(200).json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgGrievanceSent,
            details: report
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
        });
    }
};

/**
 * API call to do stripe checkout session page.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createCheckoutSession = async (req, res) => {
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    const { plan } = req.body;
    // const fee = parseFloat(plan.fee);
    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${plan.name} plan`,
                            metadata: {
                                price: plan.fee,
                                credits: plan.limit,
                                rate: plan.rate,
                                // validity: `${plan.expiration} days`,
                                // validity: plan.
                            },
                        },
                        unit_amount: Math.round(plan.fee * 100), // amount in cents
                    },
                    quantity: 1,
                },
            ],
            payment_method_types: ["card"],
            mode: 'payment',
            success_url: `${process.env.APP_URL}/payment-success?success=true&session_id={CHECKOUT_SESSION_ID}`,
            // success_url: `${process.env.APP_URL}/settings?success=true.`,
            cancel_url: `${process.env.APP_URL}/settings?canceled=true`,
        });
        console.log("session--->", session);

        // payment intent id to user, later can be used by us, to verify payment
        const paymentIntentId = session.payment_intent;

        res.json({
            code: 200,
            status: "SUCCESS",
            message: messageCode.msgPlanAddedSuccess,
            id: session.id,
            payment_intent: paymentIntentId
        });
    } catch (error) {
        console.error("An error occured at checkout ", error);
        res.json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError
        });
        return;
    }
};

/**
 * API call to get stripe payment details from id.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const fetchPaymentDetails = async (req, res) => {
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    const email = req.body.email
    const sessionId = req.body.sessionId;
    if (!email || !sessionId || sessionId == "string") {
        return res.status(400).json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInvalidInput
        });
    }

    const issuerExist = await User.findOne({ email: email });
    if (!issuerExist) {
        return res.status(400).json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInvalidEmail,
            details: email
        });
    }
    // Dynamically import fetch
    const { default: fetch } = await import('node-fetch');
    try {
        // Define your encoded Basic Auth string
        const basicAuthToken = process.env.BASIC_AUTH_TOKEN;
        // Define the session URL
        const sessionUrl =
            `https://api.stripe.com/v1/checkout/sessions/${sessionId}`;
        // Make the API call
        const sessionResponse = await fetch(sessionUrl, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${basicAuthToken}`,
            },
        });

        if (!sessionResponse.ok) {
            // throw new Error(`Failed to fetch session: ${sessionResponse.statusText}`);
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: `Invalid Session Id / ${sessionResponse.statusText}`,
            });
        }

        const session = await sessionResponse.json();
        const paymentIntentId = session.payment_intent;

        // Return the session details
        return res.status(200).json({
            code: 200,
            status: 'SUCCESS',
            paymentIntentId,    // Return payment intent ID to frontend
            sessionId,
            message: 'Session retrieved successfully',
        });

    } catch (error) {
        console.error('Error fetching session:', error);
        return res.status(500).json({ error: 'Failed to retrieve session' });
    }
};

module.exports = {

    // Function to create new subscription plan by admin
    addUserSubscriptionPlan,

    // Function to update existing subscription plan by admin
    updateSubscriptionPlan,

    // Function to delete existing subscription plan by admin
    deleteSubscriptionPlan,

    // Function to get all existing active subscription plans (all) / selected.
    getSubscriptionPlans,

    //  Function to get users current plan and warn user for credit limit exhaust or expirationdate
    getIssuerSubscriptionDetails,

    // Function to set users current subscription detials in DB by email
    addSubscriptionPlan,

    // Functionfor to add enterprise subscription plans
    addEnterpriseSubscriptionPlan,

    // Function to connect to stripe checkout page and payment
    createCheckoutSession,

    // Function to get payment details
    fetchPaymentDetails,

    // Function to send grievance report to admin portal
    createGrievance
}