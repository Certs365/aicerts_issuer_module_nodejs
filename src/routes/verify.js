const express = require('express');
const router = express.Router();
const verifyController = require('../controller/verify');

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

router.post('/verify-issuer', verifyController.verifyIssuer);

module.exports=router;