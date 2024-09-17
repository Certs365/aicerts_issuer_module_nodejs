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

/**
 * @swagger
 * /api/get-admin-graph-details/{year}:
 *   get:
 *     summary: Fetch graph data based on a year
 *     description: Retrieve graph data based on the provided year-YYYY & email.
 *     tags: [Fetch/Upload]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         description: The value used to fetch graph data. Must be a year-YYYY (number).
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       '200':
 *         description: Successfully fetched graph data.
 *         content:
 *           application/json:
 *             schema:
 *               type: number
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Indicates if the request was successful.
 *                 message:
 *                   type: string
 *                   description: A message indicating the result of the operation.
 *                 data:
 *                   type: number
 *                   description: The fetched graph data.
 *             example:
 *               status: "SUCCESS"
 *               message: Graph data fetched successfully.
 *               data: []
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
 *               status: "FAILED"
 *               message: Invalid request due to missing or invalid parameters.
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
 *               status: "FAILED"
 *               message: Internal Server Error.
 */

router.get('/get-admin-graph-details/:year', userController.getAdminGraphDetails);


module.exports=router;