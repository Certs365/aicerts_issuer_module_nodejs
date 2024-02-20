require('dotenv').config();
const nodemailer = require('nodemailer');
const ethers = require('ethers');  
const crypto = require('crypto');
const mongoose = require("mongoose");

const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.USER_MAIL, // replace with your Gmail email
            pass: process.env.MAIL_PWD,       // replace with your Gmail password
        },
    });

const mailOptions = {
    from: {
        name: 'AICerts Admin',
        address: process.env.USER_MAIL,
    }, // replace with your Gmail email
    to: '', // replace with your Gmail email
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
Welcome to AICerts Portal, You have been successfully registered, Your details to be reviewd and approved by the admin, Once your account has been approved then you will be notified..`;
      transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
  } catch (error) {
      console.error('Error sending email:', error);
  }
};

// Function to generate a new Ethereum account with a private key
const generateAccount = async () => {
    
    const id = crypto.randomBytes(32).toString('hex');
    const privateKey = "0x"+id;
    const wallet = new ethers.Wallet(privateKey);
    const addressWithoutPrefix = wallet.address; // Remove '0x' from the address
    // const addressWithoutPrefix = wallet.address.substring(2); // Remove '0x' from the address
    return addressWithoutPrefix;
    // return wallet.address;
};

const generateOTP = () => {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp; // Convert to string if you need a string representation
};

const isDBConncted = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

module.exports={sendEmail, generateAccount, generateOTP, isDBConncted, sendWelcomeMail}