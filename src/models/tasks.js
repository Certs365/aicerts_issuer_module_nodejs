require('dotenv').config();
const nodemailer = require('nodemailer');
const ethers = require('ethers');
const crypto = require('crypto');
const mongoose = require("mongoose");

// Import the Issues models from the schema defined in "../config/schema"
const { User } = require("../config/schema");

const messageCode = require("../common/codes");

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
    name: 'Certs365',
    address: process.env.USER_MAIL,
  },
  to: '',
  subject: '',
  text: '',
};

const sendEmail = async (_otp, email, name) => {
  try {
    // Ensure OTP is a string
    const otp = String(_otp);
    mailOptions.to = email;
    mailOptions.subject = `Your Authentication OTP`;
    mailOptions.html = `
<html>
  <body>
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333 border: 1px solid #ddd; border-radius: 10px;">
        <h3 style="color: #555;">Hi ${name},</h3>
        <p>Your one-time password (OTP) is:</p>
         <div style="display: flex; justify-content: center; gap: 10px; margin: 20px 0;">
            ${otp
              .split("")
              .map(
                digit => `
              <div style="
                width: 40px; 
                height: 40px; 
                display: inline-block; /* Use inline-block for better email client compatibility */
                text-align: center; 
                line-height: 40px; /* Align text vertically within the box */
                border: 1px solid #ccc; 
                border-radius: 10px; 
                font-size: 20px; 
                font-weight: bold; 
                color: #333; 
                background: #f9f9f9;">
                ${digit}
              </div>`
              )
              .join("")}
          </div>
        <p>Please enter this code to complete your authentication process.</p>
        <p>If you did not request this code, please ignore this message.</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The Certs365 Team</strong></p>
        <hr>
        <p style="font-size: 12px; color: #999;">
        ${messageCode.msgEmailNote}
        </p>
      </div>
  </body>
</html>`;
    transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendWelcomeMail = async (name, email) => {
  try {
    mailOptions.to = email;
    mailOptions.subject = `Welcome to Certs365`;
    mailOptions.html = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
    <div
        style="max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
        <h3 style="color: #555;">Hi ${name},</h3>
        <p>Welcome to the <strong>Certs365 Portal</strong>! Your registration is now complete.</p>
        <p>Your account details will be reviewed and approved by our admin team. Once your account has been approved,
            you will receive a notification with further instructions.</p>
        <p>Thank you for joining us!</p>
        <br>
        <p style="font-weight: bold;">Best regards,</p>
        <p><strong>The Certs365 Team</strong></p>
        <hr>
        <p style="font-size: 12px; color: #999;">
        ${messageCode.msgEmailNote}
        </p>
    </div>
</body>
</html>`;
    transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendGrievanceMail = async (email, id) => {
  try {
    mailOptions.to = process.env.USER_MAIL;
    mailOptions.subject = `Grievance Request`;
    mailOptions.text = `Hi Admin,

A grievance request has been submitted on the AICerts Portal. Below are the details:

- User Email: ${email}
- Payment ID: ${id}

Please review this request and take the necessary action.

If you have any questions or need additional information, please reach out to the user directly at the provided email address.

Thank you.

Best regards,
The Certs365 Team.`;
    transporter.sendMail(mailOptions);
    console.log('Grievance email sent successfully');
  } catch (error) {
    console.error('Error sending grievance email:', error);
  }
};

// Function to verify the Issuer email
const isValidIssuer = async (email) => {
  if (!email) {
    return null;
  }
  try {
    var validIssuer = await User.findOne({
      $expr: {
        $and: [
          { $eq: [{ $toLower: "$email" }, email.toLowerCase()] }
        ]
      },
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

const createInvoiceNumber = async (id, number, dateString) => {
  let [month, day, year] = dateString.split('/');
  let formattedYear = year.slice(-4); // Get last two digits of the year
  let formattedDate = `${month}${formattedYear}`; // Combine month and formatted year

  let userId = (!id) ? '0123456' : id;
  let serialNumber = (!number) ? 1 : (number + 1);
  let formatSerial = serialNumber.toString();
  // Crop last 6 digits
  let croppedIssuerId = userId.slice(-6);
  let invoiceNumber = croppedIssuerId + formattedDate + formatSerial;
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
  createInvoiceNumber,
  sendGrievanceMail,
}