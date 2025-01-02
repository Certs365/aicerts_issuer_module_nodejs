const express = require('express');
const router = express.Router();
const userController = require('../controller/matic');

router.get('/get-matic-price', userController.getMaticPrice);
router.get('/get-matic-balance', userController.getMaticBalance);
router.post('/create-payment-intent', userController.createPaymentIntent);
router.post('/create-checkout-session', userController.createCheckoutSession);
router.post('/purchase-matic', userController.purchaseMatic);

module.exports=router;