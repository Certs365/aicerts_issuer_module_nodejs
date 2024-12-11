require('dotenv').config();
// Importing functions from a custom module
const {
    isDBConnected // Function to check if the database connection is established
} = require('../models/tasks'); // Importing functions from the '../model/tasks' module

const { ethers } = require('ethers');
const messageCode = require("../common/codes");

// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);

// Initialize ethers provider with Polygon network
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

// Create wallet instance
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

const maticRate = process.env.MATIC_USD_RATE;

/**
 * API call to get Matic price.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getMaticPrice = async (req, res) => {
    try {
        // In a production environment, you would want to fetch the real price
        // from a reliable price feed or oracle
        res.status(200).json({
            price: maticRate,
            currency: 'USD'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * API call to get Matic balance.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getMaticBalance = async (req, res) => {
    const address = req.body.address;
    try {
        const balance = await provider.getBalance(address);
        
        res.status(200).json({
            address: address,
            balance: ethers.formatEther(balance),
            unit: 'MATIC'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * API call to do stripe payment intent page.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * API call to do stripe checkout session page.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createCheckoutSession = async (req, res) => {
    // let validResult = validationResult(req);
    // if (!validResult.isEmpty()) {
    //     return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
    // }
    const { purchase } = req.body;
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
                                address: plan.fee,
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
 * API call to do purchase matic page.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const purchaseMatic = async (req, res) => {
    try {
        const {
            recipientAddress,
            paymentIntentId,
            maticAmount
        } = req.body;

        // Verify payment
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment not completed');
        }

        // Validate recipient address
        if (!ethers.isAddress(recipientAddress)) {
            throw new Error('Invalid recipient address');
        }

        // Get current gas price
        const feeData = await provider.getFeeData();
        
        // Create transaction
        const tx = {
            to: recipientAddress,
            value: ethers.parseEther(maticAmount.toString()),
            gasPrice: feeData.gasPrice
        };

        // Send transaction
        const transaction = await adminWallet.sendTransaction(tx);
        
        // Wait for transaction to be mined
        const receipt = await transaction.wait();

        res.json({
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            maticAmount,
            recipientAddress
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getMaticBalance,
    getMaticPrice,
    createPaymentIntent,
    createCheckoutSession,
    purchaseMatic,
};