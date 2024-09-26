require('dotenv').config();
const nodemailer = require('nodemailer');
const ethers = require('ethers');
const crypto = require('crypto');
const mongoose = require("mongoose");

// Import the Issues models from the schema defined in "../config/schema"
const { User, Issues, BatchIssues, IssueStatus, VerificationLog, ShortUrl, DynamicIssues, ServiceAccountQuotas, DynamicBatchIssues } = require("../config/schema");

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
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

const sendEmail = async (otp, email, name) => {
  try {
    mailOptions.to = email;
    mailOptions.subject = `Your Authentication OTP`;
    mailOptions.text = `Hi ${name},

Your one-time password (OTP) is ${otp}. Please enter this code to complete your authentication process.

If you did not request this code, please ignore this message.
        
Best regards,
The AICerts Team`;
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

Welcome to the AICerts Portal, Your registration is now complete.

Your account details will be reviewed and approved by our admin team. Once your account has been approved, you will receive a notification with further instructions.

Thank you for joining us.

Best regards,
The AICerts Team.`;
    transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to verify the Issuer email
const isValidIssuer = async (email) => {
  if (!email) {
    return null;
  }
  try {
    var validIssuer = await User.findOne({
      email: email,
      status: 1
    }).select('-password');

    return validIssuer;
  } catch (error) {
    console.log("An error occured", error);
    return null;
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

const readableDateFormat = async (dateInput) => {
  let date;
  // Check if the input is in the ISO format
  if (dateInput.includes("T")) {
    date = new Date(dateInput);
  }
  // Check if the input is in the MM/DD/YYYY or M/D/YYYY format
  else {
    const [month, day, year] = dateInput.split('/');
    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
  }
  // If the date is in the future, replace it with today's date
  const today = new Date();
  if (date > today) {
    date = today;
  }
  // Format the date to MM/DD/YYYY
  const formattedMonth = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const formattedDay = String(date.getUTCDate()).padStart(2, '0');
  const formattedYear = date.getUTCFullYear();
  return `${formattedMonth}/${formattedDay}/${formattedYear}`;
};

const parseDate = async (dateInput) => {
  let date;
  // Check if the input is in the ISO format
  if (dateInput.includes("T")) {
    date = new Date(dateInput);
  }
  // Check if the input is in the MM/DD/YYYY or M/D/YYYY format
  else {
    const [month, day, year] = dateInput.split('/').map(num => num.padStart(2, '0'));
    date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }
  // Check if the date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of the day for comparison
  if (date > today) {
    return today.toISOString();
  }
  // Return the date in ISO format
  return date.toISOString();
};


// Function to format the date
const formatDate = async () => {
  let timestamp = Date.now();
  // Create a new Date object
  let date = new Date(timestamp);
  let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  let day = String(date.getDate()).padStart(2, '0');
  let year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const cerateInvoiceNumber = async (id, number, dateString) => {
  let [month, day, year] = dateString.split('/');
  let formattedYear = year.slice(-4); // Get last two digits of the year
  let formattedDate = `${month}${formattedYear}`; // Combine month and formatted year

  let userId = (!id) ? '0123456' : id;
  let serialNumber = (!number) ? 1 : (number + 1);
  let formatSerial = serialNumber.toString();
  // Crop last 6 digits
  let croppedIssuerId = userId.slice(-6);
  let invoiceNumber = croppedIssuerId + formattedDate + formatSerial;
  console.log("The final invoice", invoiceNumber);
  return invoiceNumber;
};

module.exports = {
  // Function to validate issuer by email
  isValidIssuer,
  sendEmail,
  generateAccount,
  generateOTP,
  isDBConnected,
  sendWelcomeMail,
  readableDateFormat,
  parseDate,
  formatDate,
  cerateInvoiceNumber,
}