
require('dotenv').config();
// mongodb user model
const { User, Verification } = require("../config/schema");
var admin = require("firebase-admin");
// var serviceAccount = require("../config/firebaseConfig");
const { sendEmail, generateAccount, generateOTP , isDBConncted, sendWelcomeMail } = require('../models/tasks');
// const serviceAccount = JSON.parse(process.env.CONFIG);
// Password handler
const bcrypt = require("bcrypt");
const { generateJwtToken } = require('../utils/authUtils');

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process?.env?.PRIVATE_KEY?.replace(
      /\\n/g,
     '\n',
    ),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN,
  })
});


const signup = async (req, res) => {
  let {
    name,
    organization,
    email,
    password,
    address,
    country,
    organizationType,
    city,
    zip,
    industrySector,
    state,
    websiteLink,
    phoneNumber,
    designation,
    username
  } = req.body;

  const accountDetails = await generateAccount();
  name = name.trim();
  organization = organization.trim();
  email = email.trim();
  password = password.trim();
  issuerId = accountDetails;
  approved = false;

  // Validation for mandatory fields
  const blacklistedEmailDomains = process.env.BLACKLISTED_EMAIL_DOMAINS.split(',');
  if (
    name == "" ||
    organization == "" ||
    email == "" ||
    password == "" ||
    username == ""
  ) {
    res.json({
      status: "FAILED",
      message: "Empty input fields!",
    });
    return;
  } else if (!/^[a-zA-Z ]*$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Invalid name entered",
    });
    return;
  } else if (!/^[a-zA-Z ]*$/.test(organization)) {
    res.json({
      status: "FAILED",
      message: "Invalid organization entered",
    });
    return;
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Invalid email entered",
    });
    return;
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "Password is too short!",
    });
    return;
  }else if (
    
    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) ||
    blacklistedEmailDomains.some(domain => email.endsWith('@' + domain))
  ) {
    res.json({
      status: "FAILED",
      message: "Please Enter Your Organisation Email",
    });
    return;
  }
  try {
    // Check mongoose connection
    const dbState = await isDBConncted();
    if (dbState === false) {
      console.error("Database connection is not ready");
      res.json({
        status: "FAILED",
        message: "Database connection is not ready",
      });
      return;
    } else {
      console.log("Database connection is ready");
    }

    // Checking if user already exists
    const existingUser = await User.findOne({ email });  

    if (existingUser) {
      res.json({
        status: "FAILED",
        message: "User with the provided email already exists",
      });
      return; // Stop execution if user already exists
    }

    // password handling
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save new user
    const newUser = new User({
      name,
      organization,
      email,
      password: hashedPassword,
      issuerId,
      approved: false,
      status: 0,
      address,
      country,
      organizationType,
      city,
      zip,
      industrySector,
      state,
      websiteLink,
      phoneNumber,
      designation,
      username,
      rejectedDate: null,
      certificatesIssued: 0
    });

      const savedUser = await newUser.save();
      await sendWelcomeMail(name, email);

    res.json({
      status: "SUCCESS",
      message: "Signup successful",
      data: savedUser,
    });
  } catch (error) {
    console.error(error);
    res.json({
      status: "FAILED",
      message: "An error occurred",
    });
  }
};



async function loginPhoneNumber(req, res) {
  const { idToken, email } = req.body;

  try {
    if (!idToken) {
      return res.json({
        status: "FAILED",
        message: "Invalid OTP."
      });
    }

    const credential = await admin.auth().verifyIdToken(idToken);

    // Your existing code for credential verification

    const JWTToken = generateJwtToken();
    const data = await User.findOne({ email });

    if (!data) {
      throw new Error("User not found");
    }

    res.json({
      status: "SUCCESS",
      message: "Valid User Credentials",
      data: {
        JWTToken: JWTToken,
        name: data.name,
        organization: data.organization,
        email: data.email,
        phoneNumber: data.phoneNumber
      }
    });
  } catch (error) {
    console.error("Error during login:", error.message);

    // Handle specific errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        status: "FAILED",
        message: "Invalid OTP."
      });
    }

    // Handle other errors
    res.status(500).json({
      status: "FAILED",
      message: "Internal Server Error. Please try again later."
    });
  }
}



const login = async (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Empty credentials supplied",
    });
  } else {
    // Checking if user exists  
    User.find({ email })
      .then((data) => {
        if (data.length && data[0].approved == true) {
          // User exists
          const hashedPassword = data[0].password;
          bcrypt
            .compare(password, hashedPassword)
            .then((result) => {
              const JWTToken =  generateJwtToken()
              if (result) {

                // Password match
                res.json({
                  status: "SUCCESS",
                  message: "Valid User Credentials",
                  data:{
                    JWTToken:JWTToken,
                    name:data[0]?.name,
                    organization:data[0]?.organization,
                    email:data[0]?.email,
                    certificatesIssued:data[0]?.certificatesIssued
                  }
                });
              } else {
                 // Check if user has a phone number
                 if (data[0]?.phoneNumber) {
                  res.json({
                    status: "FAILED",
                    message: "Invalid password entered!",
                    isPhoneNumber: true,
                    phoneNumber: data[0]?.phoneNumber,
                  });
                } else {
                  res.json({
                    status: "FAILED",
                    message: "Invalid password entered!",
                    isPhoneNumber: false,
                  });
                }
              }
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: "An error occurred while comparing passwords",
              });
            });
          
        } else {
          res.json({
            status: "FAILED",
            message: "Invalid credentials entered! (or) User not approved!",
          });
        }
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          message: "An error occurred while checking for existing user",
        });
      });
  }
};




const twoFactor = async (req, res) => {
  let { email } = req.body;
  const verificationCode = generateOTP();

  try {
    const verify = await Verification.findOne({ email });

    if (verify) {
      verify.code = verificationCode;
      verify.save();

      await sendEmail(verificationCode, email);

      res.status(200).json({
        status: "SUCCESS",
        message: "OTP sent to the email",
      })
    } else {
      res.status(404).json({
        status: "FAILED",
        message: "User not found",
      })
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILED",
      message: "An error occurred while sending OTP",
    })
  }
};


module.exports = {
    signup,
    login,
    twoFactor,
    loginPhoneNumber
}

