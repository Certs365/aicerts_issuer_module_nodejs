// controllers/imageController.js
const Image = require('../models/image');
const uploadImageToS3 = require('../utils/upload');
const retryOperation = require("../utils/retryOperation")

// Upload image
exports.uploadImage = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Retry upload to S3 up to 3 times if it fails
        const uploadResult = await retryOperation(() => uploadImageToS3(req.file), 3, 1000);

        const { issuerId,type } = req.body;
        const imageUrl = uploadResult.Location; // Get the S3 URL of the uploaded image
        console.log(type)

       

        const newImage = new Image({
            issuerId,
            imageUrl,
            imageType:type
        });

        await newImage.save();
      
        res.status(201).json({ message: 'Image uploaded successfully', image: newImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading image', error });
    }
};

// Get images by issuerId
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
       

        res.status(200).json(imageDetails); // Send the image URLs as the response
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching images', error });
    }
};

// Get images by issuerId
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
       

        res.status(200).json(imageDetails); // Send the image URLs as the response
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching images', error });
    }
};

// DELETE /api/delete/certificate/image/:issuerId/:imageId
exports.deleteImage = async (req, res) => {
    try {
        const { issuerId, imageId } = req.params;

        // Find the image and delete it
        const image = await Image.findOneAndDelete({ _id: imageId, issuerId });

        

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: 'Error deleting image', error });
    }
};


