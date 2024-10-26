const express = require("express");
const multer = require("multer"); // Ensure multer is imported
const { uploadImage, getImagesByIssuerId, getBackgroundsByIssuerId, deleteImage } = require("../controller/certificate_designer");


const router = express.Router();

// Configure multer for handling multipart/form-data
const upload = multer();

// Upload image route
router.post('/add/certificate/image', upload.single('image'), uploadImage);


// Get images route
router.get('/get/certificate/image/:issuerId', getImagesByIssuerId);
router.get('/get/certificate/background/:issuerId', getBackgroundsByIssuerId);
router.delete('/delete/certificate/image/:issuerId/:imageId', deleteImage);


module.exports = router

