require('dotenv').config();
// mongodb user model
const { User, Verification, ServiceAccountQuotas } = require("../config/schema");
var admin = require("firebase-admin");
const {
  generateAccount,
  generateOTP,
  isDBConnected
} = require('../models/tasks');

const {
  sendOTPEmail,
  sendWelcomeMail
} = require('../models/emails');

// Password handler
const bcrypt = require("bcrypt");
const { generateJwtToken, generateRefreshToken } = require('../utils/authUtils');
const { validationResult } = require("express-validator");
const messageCode = require("../common/codes");
const jwt = require('jsonwebtoken');

const serviceLimit = parseInt(process.env.SERVICE_LIMIT) || 10;

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.TYPE,
    project_id: toString(process.env.PROJECT_ID),
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
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
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

  // Define a mapping object for credits to service names
  const creditToServiceName = {
    1: 'issue',
    2: 'renew',
    3: 'revoke',
    4: 'reactivate'
  };

  const todayDate = new Date();

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
      code: 400,
      status: "FAILED",
      message: messageCode.msgNonEmpty,
    });
    return;
  } else if (

    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) ||
    blacklistedEmailDomains.some(domain => email.endsWith('@' + domain))
  ) {
    res.json({
      code: 400,
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
    const existingUser = await User.findOne({ 
      $expr: {
        $and: [
          { $eq: [{ $toLower: "$email" }, email.toLowerCase()] }
        ]
      }
     });

    if (existingUser) {
      res.json({
        code: 400,
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
      transactionFee: 0,
      qrPreference: 0,
      invoiceNumber: 0,
      blockchainPreference: 0,
      certificatesIssued: 0,
      certificatesRenewed: 0,
      approveDate: null,
    });
    const savedUser = await newUser.save();
    try {
      let insertPromises = [];
      for (let count = 1; count < 5; count++) {
        let serviceName = creditToServiceName[count];
        // Initialise credits
        let newServiceAccountQuota = new ServiceAccountQuotas({
          issuerId: issuerId,
          serviceId: serviceName,
          limit: serviceLimit,
          status: true,
          createdAt: todayDate,
          updatedAt: todayDate,
          resetAt: todayDate
        });
        // await newServiceAccountQuota.save();
        insertPromises.push(newServiceAccountQuota.save());
      }
      // Wait for all insert promises to resolve
      await Promise.all(insertPromises);

    } catch (error) {
      return res.json({
        code: 500,
        status: "FAILED",
        message: messageCode.msgInternalError,
      });
    }

    await sendWelcomeMail(name, email);

    return res.json({
      code: 200,
      status: "SUCCESS",
      message: messageCode.msgSignupSuccess,
      data: savedUser,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      code: 500,
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
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  const { idToken, email } = req.body;
  try {
    // Check mongoose connection
    const dbStatus = await isDBConnected();
    const dbStatusMessage = (dbStatus == true) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
    console.log(dbStatusMessage);
    if (!idToken) {
      return res.json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgInvalidOtp
      });
    }

    const credential = await admin.auth().verifyIdToken(idToken);

    // Your existing code for credential verification

    const JWTToken = generateJwtToken();
    const data = await User.findOne({ 
      $expr: {
        $and: [
          { $eq: [{ $toLower: "$email" }, email] }
        ]
      }
     });

    if (!data) {
      erro.log(messageCode.msgIssuerNotFound);
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgIssuerNotFound
      });
    }

    return res.status(200).json({
      code: 200,
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
        code: 401,
        status: "FAILED",
        message: messageCode.msgInvalidOtp
      });
    }

    // Handle other errors
    res.status(500).json({
      code: 500,
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
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }

  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (email == "" || password == "") {
    res.json({
      code: 400,
      status: "FAILED",
      message: messageCode.msgNonEmpty,
    });
  } else {
    // Checking if user exists  
    User.find({ 
      $expr: {
        $and: [
          { $eq: [{ $toLower: "$email" }, email.toLowerCase()] }
        ]
      }
     })
      .then((data) => {
        if (data.length && data[0].approved == true) {
          // User exists
          const hashedPassword = data[0].password;
          bcrypt
            .compare(password, hashedPassword)
            .then(async (result) => {
              const JWTToken = generateJwtToken()
              const refreshToken = generateRefreshToken(data[0]);

              await User.findOneAndUpdate(
                { email },          // Filter to find the user by their unique ID
                { $set: { refreshToken: refreshToken } },  // Update the refreshToken field
              );
              if (result) {
                // Password match
                return res.json({
                  code: 200,
                  status: "SUCCESS",
                  message: messageCode.msgValidCredentials,
                  data: {
                    JWTToken: JWTToken,
                    refreshToken: refreshToken,
                    name: data[0]?.name,
                    organization: data[0]?.organization,
                    email: data[0]?.email,
                    certificatesIssued: data[0]?.certificatesIssued,
                    issuerId: data[0]?.issuerId
                  }
                });
              } else {
                // Check if user has a phone number
                if (data[0]?.phoneNumber) {
                  return res.json({
                    code: 400,
                    status: "FAILED",
                    message: messageCode.msgInvalidPassword,
                    isPhoneNumber: true,
                    phoneNumber: data[0]?.phoneNumber,
                  });
                } else {
                  return res.json({
                    code: 400,
                    status: "FAILED",
                    message: messageCode.msgInvalidPassword,
                    isPhoneNumber: false,
                  });
                }
              }
            })
            .catch((err) => {
              return res.json({
                code: 400,
                status: "FAILED",
                message: messageCode.msgErrorOnComparePassword,
              });
            });

        } else {
          return res.json({
            code: 400,
            status: "FAILED",
            message: messageCode.msgInvalidOrUnapproved,
          });
        }
      })
      .catch((err) => {
        return res.json({
          code: 400,
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
    return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  const { email } = req.body;
  const verificationCode = generateOTP();
  const issuer = await User.findOne({ email: email });

  if (!issuer || !issuer.approved) {
    return res.json({
      code: 400,
      status: 'FAILED',
      message: messageCode.msgIssuerNotFound,
    });
  }
  try {
    const verify = await Verification.findOne({ email: email });
    if (verify) {
      verify.code = verificationCode;
      verify.save();
    } else {
      const createVerify = new Verification({
        email: email,
        code: verificationCode,
        verified: false
      });
      await createVerify.save();
    }
    await sendOTPEmail(verificationCode, email, issuer.name);

    res.status(200).json({
      code: 200,
      status: "SUCCESS",
      message: messageCode.msgOtpSent,
    });
    return;
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: "FAILED",
      message: messageCode.msgErrorOnOtp,
    })
  }
};

/**
 * Api for the refresh token
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const refreshToken = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  const refreshToken = req.body.token;
  const email = req.body.email;

  // Handle invalid or blacklisted refresh token
  if (!refreshToken) return res.status(401).send({ code: 401, status: "FAILED", message: messageCode.msgInvalidToken });

  try {
    const foundUser = await User.findOne({ email: email });
    // console.log(foundUser,"fd")
    if (!foundUser) {
      return res.status(401).send({ code: 401, status: "FAILED", message: messageCode.msgIssuerNotFound, details: email });
    }
    // console.log(process.env.REFRESH_TOKEN)
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN,
      async (err, decoded) => {
        // console.log('err',err)
        // console.log('decoded', decoded)
        if (err) {
          foundUser.refreshtoken = generateRefreshToken(foundUser)
          const result = await foundUser.save();
        }
        if (err || foundUser._id.toString() !== decoded.userId) {
          return res.status(403).send({ code: 403, status: "FAILED", message: messageCode.msgInvalidToken });
        }
        //refreshtoken still valid
        const JWTToken = generateJwtToken();

        const newRefreshToken = generateRefreshToken(foundUser)
        foundUser.refreshtoken = newRefreshToken
        const result = await foundUser.save();
        return res.json({
          status: "SUCCESS",
          message: messageCode.msgValidCredentials,
          data: {
            JWTToken: JWTToken,
            refreshToken: newRefreshToken,
            name: foundUser.name,
            organization: foundUser.organization,
            email: foundUser.email,
            certificatesIssued: foundUser.certificatesIssued,
            issuerId: foundUser.issuerId
          }
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(401).send({ code: 401, status: "FAILED", message: messageCode.msgTokenExpired });
  }
}
module.exports = {
  signup,
  login,
  twoFactor,
  loginPhoneNumber,
  refreshToken
}

