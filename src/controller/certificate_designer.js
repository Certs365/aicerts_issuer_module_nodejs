// controllers/imageController.js
const Image = require('../models/image');
const uploadImageToS3 = require('../utils/upload');
const retryOperation = require("../utils/retryOperation")

/**
 * API call to Upload image.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Retry upload to S3 up to 3 times if it fails
        const uploadResult = await retryOperation(() => uploadImageToS3(req.file), 3, 1000);

        const { issuerId,type } = req.body;
        const imageUrl = uploadResult.Location; // Get the S3 URL of the uploaded image
        // console.log(type)

        const newImage = new Image({
            issuerId,
            imageUrl,
            imageType:type
        });

        await newImage.save();
      
        res.status(201).json({ message: 'Image uploaded successfully', image: newImage });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error uploading image', error });
    }
};

/**
 * API call to Get images by issuerId.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getImagesByIssuerId = async (req, res) => {
    try {
        const { issuerId } = req.params;
         // Find images where issuerId matches and imageType is 'image'
         const images = await Image.find({ issuerId, imageType: 'image' });

         if (!images || images.length === 0) {
            return res.status(404).json({ message: 'No images found for this issuer' });
        }
        
           // Map over the images to extract the image URL and ID
           const imageDetails = images.map(image => ({
            id: image._id,          // Use '_id' for MongoDB ObjectId
            imageUrl: image.imageUrl
        }));
        return res.status(200).json(imageDetails); // Send the image URLs as the response
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching images', error });
    }
};

/**
 * API call to Get background images by issuerId.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getBackgroundsByIssuerId = async (req, res) => {
    try {
        const { issuerId } = req.params;
         // Find images where issuerId matches and imageType is 'image'
         const images = await Image.find({ issuerId, imageType: 'background' });

         if (!images || images.length === 0) {
            return res.status(404).json({ message: 'No backgrounds found for this issuer' });
        }
        
        // Map over the images to extract the image URL and ID
        const imageDetails = images.map(image => ({
            id: image._id,          // Use '_id' for MongoDB ObjectId
            imageUrl: image.imageUrl
        }));
       
        return res.status(200).json(imageDetails); // Send the image URLs as the response
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            code: 500,
            status: 'FAILED',
            message: 'Error fetching images', error 
        });
    }
};

/**
 * API call to delete image by issuerId.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
// DELETE /api/delete/certificate/image/:issuerId/:imageId
exports.deleteImage = async (req, res) => {
    try {
        const { issuerId, imageId } = req.params;

        // Find the image and delete it
        const image = await Image.findOneAndDelete({ _id: imageId, issuerId });

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        return res.status(200).json({ 
            code: 200,
            status: 'SUCCESS',
            message: 'Image deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        return res.status(500).json({ message: 'Error deleting image', error });
    }
};


