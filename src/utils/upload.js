const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

require('dotenv').config(); // Load environment variables from .env file

// Configure AWS S3 client
const s3Client = new S3Client({
    region: process.env.REGION, // Your region
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
});

const uploadImageToS3 = async (file) => {
    try {
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.BUCKET_NAME,
                Key: file.originalname, // Use your desired key (file name) here
                Body: file.buffer, // Assuming file.buffer contains the image data
                ContentType: file.mimetype, // Set appropriate content type
                ACL: process.env.ACL_NAME || 'public-read',
            },
        });

        upload.on('httpUploadProgress', (progress) => {
            console.log(`Uploaded: ${progress.loaded} of ${progress.total} bytes`);
        });

        const result = await upload.done();
        // console.log('Upload successful:', result);
        return result; // Return result as needed
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
};

module.exports = uploadImageToS3
