
require('dotenv').config();
// mongodb user model
const { User, Verification } = require("../config/schema");
var admin = require("firebase-admin");
// var serviceAccount = require("../config/firebaseConfig");
const { sendEmail, generateAccount, generateOTP , isDBConnected, sendWelcomeMail } = require('../models/tasks');
// const serviceAccount = JSON.parse(process.env.CONFIG);
// Password handler
const bcrypt = require("bcrypt");
const { generateJwtToken } = require('../utils/authUtils');
const { validationResult } = require("express-validator");
var messageCode = require("../common/codes");

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

  /**
   * API call for Signup Issuer.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
const signup = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid ,details: validResult.array() });
  }
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
      message: messageCode.msgNonEmpty,
    });
    return;
  } else if (
    
    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) ||
    blacklistedEmailDomains.some(domain => email.endsWith('@' + domain))
  ) {
    res.json({
      status: "FAILED",
      message: messageCode.msgEnterOrgEmail,
    });
    return;
  }
  try {
     // Check mongoose connection
     const dbStatus = await isDBConnected();
     const dbStatusMessage = (dbStatus == true) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
     console.log(dbStatusMessage);

    // Checking if user already exists
    const existingUser = await User.findOne({ email });  

    if (existingUser) {
      res.json({
        status: "FAILED",
        message: messageCode.msgExistEmail,
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
      message: messageCode.msgSignupSuccess,
      data: savedUser,
    });
  } catch (error) {
    console.error(error);
    res.json({
      status: "FAILED",
      message: messageCode.msgInternalError,
    });
  }
};

  /**
   * API call for login with phone Number.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
const loginPhoneNumber = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid ,details: validResult.array() });
  }
  const { idToken, email } = req.body;

  try {
    // Check mongoose connection
    const dbStatus = await isDBConnected();
    const dbStatusMessage = (dbStatus == true) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
    console.log(dbStatusMessage);
    if (!idToken) {
      return res.json({
        status: "FAILED",
        message: messageCode.msgInvalidOtp
      });
    }

    const credential = await admin.auth().verifyIdToken(idToken);

    // Your existing code for credential verification

    const JWTToken = generateJwtToken();
    const data = await User.findOne({ email });

    if (!data) {
      erro.log(messageCode.msgIssuerNotFound);
      res.status(400).json({
        status: "FAILED",
        message: messageCode.msgIssuerNotFound
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: messageCode.msgValidCredentials,
      data: {
        JWTToken: JWTToken,
        name: data.name,
        organization: data.organization,
        email: data.email,
        phoneNumber: data.phoneNumber
      }
    });
  } catch (error) {
    console.error(messageCode.msgErrorOnLogin, error.message);

    // Handle specific errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        status: "FAILED",
        message: messageCode.msgInvalidOtp
      });
    }

    // Handle other errors
    res.status(500).json({
      status: "FAILED",
      message: messageCode.msgInternalError
    });
  }
}

  /**
   * API call for Issuer login.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
const login = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid ,details: validResult.array() });
  }

  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: messageCode.msgNonEmpty,
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
                  message: messageCode.msgValidCredentials,
                  data:{
                    JWTToken:JWTToken,
                    name:data[0]?.name,
                    organization:data[0]?.organization,
                    email:data[0]?.email,
                    certificatesIssued:data[0]?.certificatesIssued,
                    issuerId:data[0]?.issuerId
                  }
                });
              } else {
                 // Check if user has a phone number
                 if (data[0]?.phoneNumber) {
                  res.json({
                    status: "FAILED",
                    message: messageCode.msgInvalidPassword,
                    isPhoneNumber: true,
                    phoneNumber: data[0]?.phoneNumber,
                  });
                } else {
                  res.json({
                    status: "FAILED",
                    message: messageCode.msgInvalidPassword,
                    isPhoneNumber: false,
                  });
                }
              }
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: messageCode.msgErrorOnComparePassword,
              });
            });
          
        } else {
          res.json({
            status: "FAILED",
            message: messageCode.msgInvalidOrUnapproved,
          });
        }
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          message: messageCode.msgExistingUserError,
        });
      });
  }
};

  /**
   * API call for two factor authentication.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
const twoFactor = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid ,details: validResult.array() });
  }
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
        message: messageCode.msgOtpSent,
      })
    } else {
      res.status(404).json({
        status: "FAILED",
        message: messageCode.msgIssuerNotFound,
      })
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILED",
      message: messageCode.msgErrorOnOtp,
    })
  }
};

module.exports = {
    signup,
    login,
    twoFactor,
    loginPhoneNumber
}

