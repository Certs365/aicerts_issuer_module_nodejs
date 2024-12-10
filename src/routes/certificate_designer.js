const express = require("express");
const multer = require("multer"); // Ensure multer is imported
const { uploadImage, getImagesByIssuerId, getBackgroundsByIssuerId, deleteImage } = require("../controller/certificate_designer");


const router = express.Router();

// Configure multer for handling multipart/form-data
const upload = multer();

// Upload image route
/**
 * @swagger
 * /api/add/certificate/image:
 *   post:
 *     summary: Upload an image
 *     description: API to Uploads an image to the server, stores it in S3, and saves the details in the database.
 *     tags: [Credential Design]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload.
 *               issuerId:
 *                 type: string
 *                 description: ID of the issuer associated with the image.
 *                 example: "12345"
 *               type:
 *                 type: string
 *                 description: The type of image being uploaded (e.g., "background", "image").
 *                 example: "image"
 *     responses:
 *       '201':
 *         description: Image uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier for the saved image.
 *                   example: "6432fa50b8c1f17e12d3f2b8"
 *                 issuerId:
 *                   type: string
 *                   description: ID of the issuer associated with the image.
 *                   example: "12345"
 *                 imageUrl:
 *                   type: string
 *                   description: URL of the image.
 *                   example: "https://example.com/images/background1.png"
 *                 imageType:
 *                   type: string
 *                   description: The type of image (e.g., "background", "image").
 *                   example: "image"
 * 
 *       '400':
 *         description: No file uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "No file uploaded"
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
 *               message: "Error uploading image"
 */
router.post('/add/certificate/image', upload.single('image'), uploadImage);

// Get images route
/**
 * @swagger
 * /api/get/certificate/image/{issuerId}:
 *   get:
 *     summary: Get images by issuerId
 *     description: API to Fetch all images of type 'image' for a specific issuer by their ID
 *     tags: [Credential Design]
 *     parameters:
 *       - name: issuerId
 *         in: path
 *         description: ID of the issuer for which to retrieve images.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully retrieved images.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier for the image.
 *                   example: "6432fa50b8c1f17e12d3f2b8"
 *                 imageUrl:
 *                   type: string
 *                   description: URL of the image.
 *                   example: "https://example.com/images/background1.png"
 * 
 *       '404':
 *         description: No images found for the given issuerId.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               code: 404
 *               status: "FAILED"
 *               message: "No images found for this issuer"
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
 *               message: "Error fetching images"
 */
router.get('/get/certificate/image/:issuerId', getImagesByIssuerId);

/**
 * @swagger
 * /api/get/certificate/background/{issuerId}:
 *   get:
 *     summary: Get backgrounds by issuerId
 *     description: API to Fetch all background images for a specific issuer by their ID
 *     tags: [Credential Design]
 *     parameters:
 *       - name: issuerId
 *         in: path
 *         description: ID of the issuer for which to retrieve background images.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully retrieved background images.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier for the background image.
 *                   example: "6432fa50b8c1f17e12d3f2b8"
 *                 imageUrl:
 *                   type: string
 *                   description: URL of the background image.
 *                   example: "https://example.com/images/background1.png"
 * 
 *       '404':
 *         description: No backgrounds found for the given issuerId.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "No backgrounds found for this issuer"
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
 *               message: "Error fetching images"
 */
router.get('/get/certificate/background/:issuerId', getBackgroundsByIssuerId);

/**
 * @swagger
 * /api/delete/certificate/image/{issuerId}/{imageId}:
 *   delete:
 *     summary: Delete an image by issuerId and imageId 
 *     description: API Deletes a specific image based on the provided issuerId and imageId.
 *     tags: [Credential Design]
 *     parameters:
 *       - name: issuerId
 *         in: path
 *         description: ID of the issuer associated with the image
 *         required: true
 *         schema:
 *           type: string
 *       - name: imageId
 *         in: path
 *         description: ID of the image to be deleted
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Image deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Image deleted successfully"
 *       '404':
 *         description: Image not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Image not found"
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
 *               message: "Error deleting image"
 */
router.delete('/delete/certificate/image/:issuerId/:imageId', deleteImage);


module.exports = router

