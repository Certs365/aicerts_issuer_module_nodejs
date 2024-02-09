require('dotenv').config();
const nodemailer = require('nodemailer');
const ethers = require('ethers');  
const crypto = require('crypto');

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
        name: 'Web Wizard',
        address: process.env.USER_MAIL,
    }, // replace with your Gmail email
    to: '', // replace with your Gmail email
    subject: 'Auth OTP',
    text: '',
};

const sendEmail = async (otp, email) => {
    try {
        mailOptions.to = email;
        mailOptions.text = `Your OTP is ${otp}. Please enter it to complete authentication.`;
        await transporter.sendMail(mailOptions);
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
    const addressWithoutPrefix = wallet.address.substring(2); // Remove '0x' from the address
    return addressWithoutPrefix;
    // return wallet.address;
};

const generateOTP = () => {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp; // Convert to string if you need a string representation
}

module.exports={sendEmail, generateAccount, generateOTP}