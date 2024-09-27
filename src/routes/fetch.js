const express = require('express');
const router = express.Router();
const userController = require('../controller/fetch');
const validationRoute = require('../common/validationRoutes');

/**
 * @swagger
 * /api/get-all-issuers:
 *   get:
 *     summary: Get details of all issuers count with Active & Inactive status counts
 *     description: API to fetch all issuer details who are Active/Inactive/Total.
 *     tags: [Fetch/Upload]
 *     security:
 *       - BearerAuth: []
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
 * /api/get-issuer-by-email:
 *   post:
 *     summary: Get issuer details by email
 *     description: API to Fetch Issuer details on email request.
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
 *                 description: Issuer's email address
 *     responses:
 *       '200':
 *         description: Issuer fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: object
 *                   description: Issuer details
 *                 message:
 *                   type: string
 *                   example: Issuer fetched successfully
 *       '400':
 *         description: Bad request or issuer not found
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
 *                   example: Issuer not found (or) Bad request!
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
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal server error
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
 *                   example: An error occurred during the process!
 */

router.post('/get-issuer-by-email', validationRoute.emailCheck, userController.getIssuerByEmail);

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
 * /api/get-server-details:
 *   get:
 *     summary: Get details of all servers listed by the admin
 *     description: API to fetch all details of all servers listed by the admin.
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All details fetched successfully
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
 *                     [Servers Details]
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

router.get('/get-server-details', userController.fetchServerDetails);

/**
 * @swagger
 * /api/upload-server-details:
 *   post:
 *     summary: API call for upload server details
 *     description: API call for upload server details.
 *     tags: [Server]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The admin email.
 *               serverName:
 *                 type: string
 *                 description: The server name.
 *               serverEndpoint:
 *                 type: string
 *                 description: The server endpoint name.
 *               serverAddress:
 *                 type: string
 *                 description: The server IP Address or URL.
 *             required:
 *               - email
 *               - serverNamwe
 *               - serverEndpoint
 *               - serverAddress
 *     responses:
 *       '200':
 *         description: Server details uploaded Successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       '400':
 *         description: Certificate already issued or invalid input
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
 *               code: 400.
 *               status: "FAILED"
 *               message: Error message not getting uploaded.
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
 *               code: 500.
 *               status: "FAILED"
 *               message: Internal server error.
 */

router.post('/upload-server-details', validationRoute.setServer, userController.uploadServerDetails);

/**
 * @swagger
 * /api/delete-server-details:
 *   delete:
 *     summary: API call for delete server details
 *     description: API call for delete server details.
 *     tags: [Server]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serverName:
 *                 type: string
 *                 description: The server name.
 *             required:
 *               - serverNamwe
 *     responses:
 *       '200':
 *         description: Server details deleted Successfully
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
 *               code: 200.
 *               status: "SUCCESS"
 *               message: Server details deleted successfully.
 *       '400':
 *         description: Certificate already issued or invalid input
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
 *               code: 400.
 *               status: "FAILED"
 *               message: Error on deleting server.
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
 *               code: 500.
 *               status: "FAILED"
 *               message: Internal server error.
 */

router.delete('/delete-server-details', validationRoute.checkServerName, userController.deleteServerDetails);

/**
 * @swagger
 * /api/get-credits-by-email:
 *   post:
 *     summary: Get issuer sevice credit limits by email
 *     description: API to Fetch Issuer service credit limits details on email request.
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
 *                 description: Issuer's email address
 *     responses:
 *       '200':
 *         description: Issuer fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: object
 *                   description: Issuer details
 *                 message:
 *                   type: string
 *                   example: Issuer fetched successfully
 *       '400':
 *         description: Bad request or issuer not found
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
 *                   example: Issuer not found (or) Bad request!
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
 *               status: "FAILED"
 *               message: Error message for invalid input.
 *       '500':
 *         description: Internal server error
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
 *                   example: An error occurred during the process!
 */

router.post('/get-credits-by-email', validationRoute.emailCheck, userController.getServiceLimitsByEmail);


/**
 * @swagger
 * /api/get-certificate-templates:
 *   post:
 *     summary: Fetch saved certificate templates by email
 *     description: Retrieve all saved certificate templates based on the provided email.
 *     tags: [Template]
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
 *     tags: [Template]
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
 *     tags: [Template]
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

/**
 * @swagger
 * /api/generate-excel-report:
 *   post:
 *     summary: API to generate the Excel report as per Issuer input, Start date and End date. 
 *     description: API to generate the Excel report as per Issuer input, Start date and End date, Example Date 2024-09-20T23:59:59.999Z. 
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
 *                 description: Email associated with the issuer.
 *               value:
 *                 type: number
 *                 description: the flag value.
 *               startDate:
 *                 type: string
 *                 description: The valid start date in (MM/DD/YYYY) format.
 *               endDate:
 *                 type: string
 *                 description: The valid end date in (MM/DD/YYYY) format.
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

router.post('/generate-excel-report', validationRoute.generateExcel, userController.generateExcelReport);

/**
 * @swagger
 * /api/generate-invoice-report:
 *   post:
 *     summary: API to generate the pdf invoice as per Issuer email, input (optional). 
 *     description: API to generate the Excel report as per Issuer email, input (optional). 
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
 *                 description: Email associated with the issuer.
 *               input:
 *                 type: number
 *                 description: The optional input.
 *             required:
 *               - email
 *               - input
 *     responses:
 *       '200':
 *         description: Successfully generated the invoice.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *             example:
 *               code: 200
 *               status: "SUCCESS"
 *               message: "PDF invoice saved successfully."
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
 *               message: "Unable to generate invoice"
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

router.post('/generate-invoice-report', validationRoute.generateInvoice, userController.generateInvoiceDocument);



module.exports = router;