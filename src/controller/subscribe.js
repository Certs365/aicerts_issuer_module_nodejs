// Load environment variables from .env file
require('dotenv').config();

const { validationResult } = require("express-validator");

// Import MongoDB models
const { Admin, User, SubscriptionPlan, UserSubscriptionPlan } = require("../config/schema");

const messageCode = require("../common/codes");

// Importing functions from a custom module
const {
    formatDate,
    isDBConnected, // Function to check if the database connection is established
    parseDate,
    readableDateFormat,
    createInvoiceNumber,
    isValidIssuer
} = require('../models/tasks'); // Importing functions from the '../model/tasks' module

// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);

/**
 * API call to set details of users current subscritpion plan in DB by email.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const addSubscriptionPlans = async (req, res) => {
    const todayDate = new Date();
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }

    const { email, subscriptionPlanName, subscriptionDuration, allocatedCredentials, currentCredentials } = req.body;

    try {
        // Check mongoose connection
        const dbStatus = await isDBConnected();
        const dbStatusMessage = (dbStatus) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
        console.log(dbStatusMessage);

        const issuerExist = await User.findOne({ email: email });
        if (!issuerExist || !issuerExist.issuerId) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidIssuer, details: email });
        }
        const issuerId = issuerExist.issuerId;

        const subscriptionDetails = new UserSubscriptionPlan({
            email: email,
            issuerId: issuerId,
            subscriptionPlanName: subscriptionPlanName,
            purchasedDate: todayDate,
            subscriptionDuration: subscriptionDuration,
            allocatedCredentials: allocatedCredentials,
            currentCredentials: currentCredentials,
        });
        const savePlan = await subscriptionDetails.save();

        res.json({
            code: 200,
            status: "SUCCESS",
            message: messageCode.msgOperationSuccess,
            data: savePlan
        });


    } catch (error) {
        res.json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInternalError
        });
    }
};

/**
 * API call for set details of all plans, one time thing.
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
 * API call for get details of selected / all plans for the ui.
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
 * API call for deletion of selective or all plan for ui.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteSubscriptionPlans = async (req, res) => {
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
        const isAdmin = await Admin.findOne({ email: email });
        if (!isAdmin) {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgAdminMailNotExist,
            });
        }
        if (planCode && planCode != "string") {
            const getPlan = await SubscriptionPlan.deleteOne({ code: planCode });
            if (getPlan) {
                return res.status(400).json({
                    code: 200,
                    status: 'FAILED',
                    message: messageCode.msgPlanNotFound,
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
        await SubscriptionPlan.deleteMany({});
        res.json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgPlanDetailsUpdated,
        });
    } catch (error) {
        res.json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInternalError,
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
        const dbStatus = await isDBConnected();
        const dbStatusMessage = (dbStatus) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
        console.log(dbStatusMessage);

        const { email } = req.body;

        const issuerExist = await User.findOne({ email: email });
        if (!issuerExist || !issuerExist.issuerId) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidIssuer, details: email });
        }

        const subscriptionDetails = await UserSubscriptionPlan.find({ email });

        //!  msgMatchLimitsNotFound, msgMatchLimitsFound -> no message init, need to fix
        // Get the plan details
        if (!subscriptionDetails) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgNoMatchFound, details: email });
        }
        const latestPlanDetails = subscriptionDetails[subscriptionDetails.length - 1];

        console.log("latestPlan", latestPlanDetails);
        let planDetails = {
            subscriptionPlanName: latestPlanDetails.subscriptionPlanName,
            purchasedDate: latestPlanDetails.purchasedDate,
            subscriptionDuration: latestPlanDetails.subscriptionDuration,
            allocatedCredentials: latestPlanDetails.allocatedCredentials,
            currentCredentials: latestPlanDetails.currentCredentials,
            status: latestPlanDetails.status
        };

        if (!planDetails) {
            return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgNoMatchFound, details: email });
        }

        // if user exhausted all credits
        if (planDetails.currentCredentials == 0) {
            await UserSubscriptionPlan.updateOne({ email }, { status: false });
            planDetails.status = false;
            return res.status(200).json({ code: 200, status: "WARNING", message: messageCode.msgLimitExhausted, details: planDetails });
        }


        // check for expiring  in 5 day or less

        // const today = new Date();
        // const purchaseDate = new Date(planDetails.purchasedDate);
        // const expireDate = new Date(purchaseDate.setDate(purchaseDate.getDate() + planDetails.subscriptionDuration));
        // const diffTime = Math.abs(today - expireDate);
        // const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));


        function normalizeDate(date) {
            return new Date(date.setHours(0, 0, 0, 0));
        }
        const today = normalizeDate(new Date());
        const purchaseDate = normalizeDate(new Date(planDetails.purchasedDate));
        const expireDate = normalizeDate(new Date(purchaseDate.setDate(purchaseDate.getDate() + planDetails.subscriptionDuration)))
        // const diffTime = Math.abs(today - expireDate);
        // const diffTime =  expireDate - today;
        const diffTime = today > expireDate ? 0 : expireDate - today;
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        // console.log("today", today)
        // console.log("expireDate", expireDate)
        // console.log("e-t", expireDate - today)
        // console.log("t-e", today- expireDate)
        // console.log("purchase date", purchaseDate)
        // console.log("diffTime", diffTime)
        // console.log("diffDays", diffDays)
        // console.log("expireDate",normalizeDate(new Date(purchaseDate.setDate(purchaseDate.getDate() + planDetails.subscriptionDuration))));
        // console.log("datediff",normalizeDate(new Date(purchaseDate.setDate(purchaseDate.getDate() -1))));
        // todo=> below, credit and plan name is hardcoded for now.
        if (diffDays <= 5 && diffDays > 0) {
            return res.status(200).json({ code: 200, status: "SUCCESS", message: messageCode.msgLimitAboutToExhaust, details: planDetails, remainingDays: diffDays });
        } else if (diffDays <= 0) {
            const result = await UserSubscriptionPlan.findOneAndUpdate(
                { email },
                {
                    $set: {
                        status: false,
                        currentCredentials: 0,
                        subscriptionPlanName: "Free"
                    }
                },
                { new: true } // give the updated document
            );
            // console.log(result);
            if (!result) {
                return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInternalError });
            }
            planDetails.status = false;
            planDetails.currentCredentials = 0;
            planDetails.subscriptionPlanName = "Free";
            return res.status(200).json({ code: 200, status: "SUCCESS", message: messageCode.msgLimitExhausted, details: planDetails, remainingDays: diffDays });
        } else {
            return res.status(200).json({ code: 200, status: "SUCCESS", message: messageCode.msgPlanDetailsFetched, details: planDetails });
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
    const { email, subscriptionPlanName, subscriptionDuration, allocatedCredentials, currentCredentials } = req.body;

    if (!email, !subscriptionPlanName, !subscriptionDuration, !allocatedCredentials, !currentCredentials) {
        return res.status(400).json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInvalidInput
        });
    }
    try {

        // Check mongoose connection
        const dbStatus = await isDBConnected();
        const dbStatusMessage = (dbStatus == true) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
        console.log(dbStatusMessage);
        const issuerExist = await User.findOne({ email: email });
        if (issuerExist) {
            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgPlanNotFound,
                details: email
            });
        }

        const enterprisePlanExist = await UserSubscriptionPlan.findOne({ email: email });

        if (enterprisePlanExist) {
            enterprisePlanExist.subscriptionPlanName.push(subscriptionPlanName);
            enterprisePlanExist.purchasedDate.push(todayDate);
            enterprisePlanExist.subscriptionDuration.push(subscriptionDuration);
            enterprisePlanExist.allocatedCredentials.push(allocatedCredentials);
            enterprisePlanExist.currentCredentials.push(currentCredentials);

            await enterprisePlanExist.save();
        }

        const subscriptionDetails = new UserSubscriptionPlan({
            email: email,
            issuerId: issuerExist.issuerId,
            subscriptionPlanName: [subscriptionPlanName],
            purchasedDates: [todayDate], // Initialize with an array
            subscriptionDurations: [subscriptionDuration], // Initialize with an array
            allocatedCredentials: [allocatedCredentials], // Initialize with an array
            currentCredentials: [currentCredentials], // Initialize with an array
        });
        const savePlan = await subscriptionDetails.save();

        //todo=> amount is hardcoded as of now, please make it dynamic as per user inputs
        const amount = 5 * allocatedCredentials;

        res.json({
            code: 200,
            status: "SUCCESS",
            message: messageCode.msgOperationSuccess,
            data: savePlan,
            amount: amount,
        });
        return;

    } catch (error) {
        res.json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError
        });
    }
};

/**
 * API call to get details of selected / all enterprise plans.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const fetchEnterpriseSubscriptionPlan = async (req, res) => {
    let validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    }
    const email = req.body.email;
    const subscriptionPlanName = req.body.enterprisePlan;
    var isPlanExist;
    try {
        await isDBConnected();
        if (subscriptionPlanName && subscriptionPlanName != "string") {
            // Check if the email exists and the subscriptionPlanName is in the array
            //     isPlanExist = await UserSubscriptionPlan.findOne({
            //         email: email,
            //         subscriptionPlanName: { $in: [subscriptionPlanName] }
            //     });
            // } else {
            //     isPlanExist = await UserSubscriptionPlan.findOne({ email: email });
            // }

            // if (isPlanExist) {
            //     return res.status(200).json({
            //         code: 200,
            //         status: 'SUCCESS',
            //         message: messageCode.msgPlanDetailsFetched,
            //         details: isPlanExist
            //     });
            // } else {
            //     return res.status(400).json({
            //         code: 400,
            //         status: 'FAILED',
            //         message: messageCode.msgPlanNotFound,
            //         details: email
            //     });
            // }

            // Find the document
            const userPlan = await UserSubscriptionPlan.findOne({ email: email });

            if (userPlan) {
                // Get all matched indexes
                const matchedIndexes = userPlan.subscriptionPlanName
                    .map((plan, index) => (plan === subscriptionPlanName ? index : -1))
                    .filter(index => index !== -1);

                // If there are matches, retrieve corresponding details
                if (matchedIndexes.length > 0) {
                    const matchedDetails = matchedIndexes.map(index => ({
                        subscriptionPlanName: userPlan.subscriptionPlanName[index],
                        purchasedDate: userPlan.purchasedDate[index],
                        subscriptionDuration: userPlan.subscriptionDuration[index],
                        allocatedCredentials: userPlan.allocatedCredentials?.[index],
                        currentCredentials: userPlan.currentCredentials?.[index],
                    }));

                    return res.status(200).json({
                        code: 200,
                        status: 'SUCCESS',
                        message: messageCode.msgPlanDetailsFetched,
                        details: matchedDetails,
                    });
                }
            }

            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgPlanNotFound,
                details: email,
            });
        } else {
            // Default logic if no specific subscriptionPlanName is provided
            isPlanExist = await UserSubscriptionPlan.findOne({ email: email });

            if (isPlanExist) {
                return res.status(200).json({
                    code: 200,
                    status: 'SUCCESS',
                    message: messageCode.msgPlanDetailsFetched,
                    details: isPlanExist,
                });
            }

            return res.status(400).json({
                code: 400,
                status: 'FAILED',
                message: messageCode.msgPlanNotFound,
                details: email,
            });
        }

    } catch (error) {
        console.error("An error occured while fetching enterprise plan ", error);
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgInternalError,
            details: error
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
    try {
        const { email, paymentID } = req.body;
        const report = {
            email,
            paymentID
        }
        res.json({
            code: 200,
            status: 'SUCCESS',
            message: messageCode.msgPlanDetailsFetched,
            details: report
        });
    } catch (error) {
        res.json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgPlanNotAdded,
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
    const { sessionId } = req.params;
    if (!sessionId) {
        res.status(400).json({
            code: 400,
            status: 'FAILED',
            message: messageCode.msgInvalidInput
        });
        return;
    }

    try {
        // Fetch payment intent details from Stripe using the payment ID
        const paymentIntent = await stripe.paymentIntents.retrieve(sessionId);
        console.log(paymentIntent);
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Retrieve the payment_intent from the session object
        const paymentIntentId = session.payment_intent;

        console.log('Payment Intent ID:', paymentIntentId);  // Log the payment intent

        // Return the payment intent and session details
        res.json({
            paymentIntentId,    // Return payment intent ID to frontend
            sessionId,          // Also return session ID
            message: 'Session retrieved successfully',
        });
        return;

    } catch (err) {
        console.error('Error fetching session:', err);  // Log any errors during session retrieval
        res.status(500).json({ error: 'Failed to retrieve session' });
    }
};

module.exports = {
    //set subscription plans
    updateSubscriptionPlan,

    // get details of all plans
    getSubscriptionPlans,

    //  Function to get users current plan and warn user for credit limit exhaust or expirationdate
    getIssuerSubscriptionDetails,

    // Function to set users current subscription detials in DB by email
    addSubscriptionPlans,

    // Functionfor to add enterprise subscription plans
    addEnterpriseSubscriptionPlan,

    // Functionfor to fetch enterprise subscription plans
    fetchEnterpriseSubscriptionPlan,

    // for testing, deletion purpose
    deleteSubscriptionPlans,

    // Function to connect to stripe checkout page and payment
    createCheckoutSession,

    // Function to get payment details
    fetchPaymentDetails,

    // Function to send grievance report to admin portal
    createGrievance
}