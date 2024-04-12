require('dotenv').config();
const nodemailer = require('nodemailer');
const ethers = require('ethers');  
const crypto = require('crypto');
const mongoose = require("mongoose");

const transporter = nodemailer.createTransport({
        service:  process.env.MAIL_SERVICE,
        host: process.env.MAIL_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.USER_NAME, 
            pass: process.env.MAIL_PWD,      
        },
    });

const mailOptions = {
    from: {
        name: 'AICerts Admin',
        address: process.env.USER_MAIL,
    },
    to: '', 
    subject: '',
    text: '',
};

const sendEmail = async (otp, email) => {
    try {
        mailOptions.to = email;
        mailOptions.subject = `Auth OTP`;
        mailOptions.text = `Your OTP is ${otp}. Please enter it to complete authentication.`;
        transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendWelcomeMail = async (name, email) => {
  try {
      mailOptions.to = email;
      mailOptions.subject = `Welcome to AICerts`;
      mailOptions.text = `Hi ${name}, 
Welcome to AICerts Portal, You have been successfully registered, Your details to be reviewed and approved by the admin, Once your account has been approved then you will be notified..`;
      transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
  } catch (error) {
      console.error('Error sending email:', error);
  }
};



// Function to generate a new Ethereum account with a private key
const generateAccount = async () => {
  try {
    const id = crypto.randomBytes(32).toString('hex');
    const privateKey = "0x" + id;
    const wallet = new ethers.Wallet(privateKey);
    const addressWithoutPrefix = wallet.address; // Remove '0x' from the address
    // const addressWithoutPrefix = wallet.address.substring(2); // Remove '0x' from the address
    return addressWithoutPrefix;
    // return wallet.address;
  } catch (error) {
    console.error("Error generating Ethereum account:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

const generateOTP = () => {
  try {
    // Generate a random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp; // Convert to string if you need a string representation
  } catch (error) {
    console.error("Error generating OTP:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

const isDBConnected = async () => {
    let retryCount = 0; // Initialize retry count
    var maxRetries = 3;
    while (retryCount < maxRetries) {
      try {
        // Attempt to establish a connection to the MongoDB database using the provided URI
        await mongoose.connect(process.env.MONGODB_URI);
        // console.log('Connected to MongoDB successfully!');
        return true; // Return true if the connection is successful
      } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        retryCount++; // Increment retry count
        console.log(`Retrying connection (${retryCount}/${maxRetries}) in 1.5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay)); // Wait for 1.5 seconds before retrying
      }
    }
    console.error('Failed to connect to MongoDB after maximum retries.');
    return false; // Return false if unable to connect after maximum retries
  };

module.exports={sendEmail, generateAccount, generateOTP, isDBConnected, sendWelcomeMail}