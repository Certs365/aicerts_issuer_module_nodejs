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

/**
 * @swagger
 * /api/get-certificate-templates:
 *   post:
 *     summary: Fetch saved certificate templates by email
 *     description: Retrieve all saved certificate templates based on the provided email.
 *     tags: [Fetch/Upload]
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
 *                 description: Email to fetch the templates for.
 *           example:
 *             email: "user@example.com"
 *     responses:
 *       '200':
 *         description: Successfully fetched templates.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Indicates if the request was successful.
 *                 message:
 *                   type: string
 *                   description: A message indicating the result of the operation.
 *                 data:
 *                   type: array
 *                   description: List of saved templates.
 *                   items:
 *                     type: object
 *             example:
 *               status: "PASSED"
 *               message: "Templates fetched successfully."
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
 *               message: "No templates found for the provided email."
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
 *               message: "Error fetching templates."
 */
// Route for fetching certificate templates by email
router.post('/get-certificate-templates', userController.getCertificateTemplates);

// Route for adding a new certificate template
/**
 * @swagger
 * /api/add-certificate-template:
 *   post:
 *     summary: Add a new certificate template
 *     description: Creates and saves a new certificate template using the provided email, URL, and design fields.
 *     tags: [Fetch/Upload]
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
 *                 description: Email associated with the template.
 *               url:
 *                 type: string
 *                 description: URL of the certificate.
 *               designFields:
 *                 type: object
 *                 description: Design fields for the certificate.
 *           example:
 *             email: "user@example.com"
 *             url: "https://example.com/certificate.pdf"
 *             designFields: { "field1": "value1", "field2": "value2" }
 *     responses:
 *       '200':
 *         description: Successfully saved certificate template.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Indicates if the request was successful.
 *                 message:
 *                   type: string
 *                   description: A message indicating the result of the operation.
 *                 data:
 *                   type: object
 *                   description: The saved certificate template.
 *             example:
 *               status: "PASSED"
 *               message: "Template saved successfully."
 *               data: { "email": "user@example.com", "url": "https://example.com/certificate.pdf", "designFields": { "field1": "value1", "field2": "value2" } }
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
 *               message: "Error saving template."
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
 *               message: "Internal Server Error."
 */
router.post('/add-certificate-template', userController.addCertificateTemplate);


/**
 * @swagger
 * /api/update-certificate-template:
 *   put:
 *     summary: Update a certificate template
 *     description: Update an existing certificate template using the template ID and other optional fields like URL and design fields.
 *     tags: [Fetch/Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The unique identifier of the certificate template to update.
 *               url:
 *                 type: string
 *                 description: The new URL of the certificate (optional).
 *               designFields:
 *                 type: object
 *                 description: The updated design fields for the certificate template (optional).
 *           example:
 *             id: "64f8c5b9e6a4e5b441ec4f12"
 *             url: "https://example.com/new-certificate.pdf"
 *             designFields: { "field1": "new value1", "field2": "new value2" }
 *     responses:
 *       '200':
 *         description: Successfully updated certificate template.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Indicates if the update was successful.
 *                 message:
 *                   type: string
 *                   description: A message indicating the result of the operation.
 *                 data:
 *                   type: object
 *                   description: The updated certificate template.
 *             example:
 *               status: "PASSED"
 *               message: "Template updated successfully."
 *               data: 
 *                 id: "64f8c5b9e6a4e5b441ec4f12"
 *                 url: "https://example.com/new-certificate.pdf"
 *                 designFields: { "field1": "new value1", "field2": "new value2" }
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
 *               message: "Template not found."
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
 *               message: "Error updating template."
 */

router.put('/update-certificate-template', userController.updateCertificateTemplate);

module.exports=router;