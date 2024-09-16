const express = require('express');
const router = express.Router();
const userController = require('../controller/fetch');

/**
 * @swagger
 * /api/get-all-issuers:
 *   get:
 *     summary: Get details of all issuers count with Active & Inactive status counts
 *     description: API to fetch all issuer details who are Active/Inactive/Total.
 *     tags: [Fetch/Upload]
 *     responses:
 *       200:
 *         description: All user details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: array
 *                   items:
 *                     [Issuers Details]
 *                 message:
 *                   type: string
 *                   example: All user details fetched successfully
 *       400:
 *         description: Unable to fetch Issuer details, Please try again
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
 *                   example: An error occurred while fetching user details
 *             example:
 *               code: 400.
 *               status: "FAILED"
 *               message: Unable to fetch Issuer details, Please try again.
 *       '500':
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

router.get('/get-all-issuers', userController.getAllIssuers);

module.exports=router;