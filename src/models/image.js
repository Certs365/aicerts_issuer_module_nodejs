// models/Image.js
const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    issuerId: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    imageType:{
        type:String,
        required:true
    }
}, { timestamps: true });

module.exports = mongoose.model('Image', ImageSchema);
