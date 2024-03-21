
require('dotenv').config();
const app = require('express')();
const express = require("express");

const Web3 = require('web3');
const web3 = new Web3(process.env.RPC_URL);
// mongodb user model
const { User, Verification, Issues } = require("../config/schema");
var admin = require("firebase-admin");
// var serviceAccount = require("../config/firebaseConfig");
const { sendEmail, generateAccount, generateOTP , isDBConncted, sendWelcomeMail } = require('../models/tasks');
// const serviceAccount = JSON.parse(process.env.CONFIG);
// Password handler
const bcrypt = require("bcrypt");
const { generateJwtToken } = require('../utils/authUtils');
require('dotenv').config();

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
 * API call for Signup issuer.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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
  id = accountDetails;
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

    // Checking iff user was blocked
    // const blockedUser = await Blacklist.findOne({ email });

    // if (blockedUser) {
    //   res.json({
    //     status: "FAILED",
    //     message: "Access has been restricted, please try with another email",
    //   });
    //   return; // Stop execution if user already blacklisted
    // }

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
      id,
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

/**
 * API call for issuer login with Phone Number.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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

/**
 * API call for Update issuer.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateIssuer = async (req, res) => {
  // Get id from req.body instead of req.query
  const { id } = req.body; 
  const updateFields = req.body;

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

    // Find the issuer by id
    console.log(id)
    const existingIssuer = await User.findById(id);
    console.log(existingIssuer)

    if (!existingIssuer) {
      res.json({
        status: "FAILED",
        message: "Issuer not found",
      });
      return;
    }

    // Update specific fields
    for (const key in updateFields) {
      if (Object.hasOwnProperty.call(updateFields, key)) {
        existingIssuer[key] = updateFields[key];
      }
    }

    // Save the updated issuer
    const updatedIssuer = await existingIssuer.save();

    res.json({
      status: "SUCCESS",
      message: "Issuer updated successfully",
      data: updatedIssuer,
    });
  } catch (error) {
    console.error(error);
    res.json({
      status: "FAILED",
      message: "An error occurred",
    });
  }
};

/**
 * API call for Login issuer.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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
                    email:data[0]?.email
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

// const logout = async (req, res) => {
//   let { email } = req.body;
//   try {
//     const user = await User.findOne({ email });

//     if (!user || !user.approved) {
//       return res.json({
//         status: 'FAILED',
//         message: 'User not found (or) User not approved!',
//       });
//     }

//     } catch (error) {
//     res.json({
//       status: 'FAILED',
//       message: 'An error occurred during the logout!',
//     });
//   }

// };

/**
 * API call for 2 Factor Authentication issuer.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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

/**
 * API call for verify issuer.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const verifyIssuer = async (req, res) => {
  let { email, code } = req.body;
  // console.log(req.body);
  try {
    const verify = await Verification.findOne({ email });

    Verification.find({ email })
      .then((result) => {
        // console.log(result,"res");
        if (result.length && verify.code == code) {
          // A email already exists
          res.json({
                status: "PASSED",
                message: "Verification successful",
          });
          
          if(verify.verified == false) {
            verify.verified = true;
            verify.save();
          }
        } else {
          res.json({
            status: "FAILED",
            message: "Verification failed",
          });
         }
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          message: "An error occurred while checking for OTP",
        });
      });
    
    } catch (error) {
    res.json({
      status: 'FAILED',
      message: 'An error occurred during the verification!',
    });
  }
};

/**
 * API call for issuer forget password.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const forgotPassword = async (req, res) => {
  let { email } = req.body;
  const generatedOtp = generateOTP();
  try {
    const verify = await Verification.findOne({ email });

    const user = await User.findOne({ email });

    if (!user || !user.approved) {
      return res.json({
        status: 'FAILED',
        message: 'User not found (or) User not approved!',
      });
    }
    
    if (!verify ){
       // Save verification details
       const newVerification = new Verification({
          email,
          code: generatedOtp,
          verified: false,
        });
      const savedVerification = await newVerification.save();
    } else {
      // Update verification details
      verify.code = generatedOtp;
      verify.verified = true;
      await verify.save();
    }
    // password handling
    sendEmail(generatedOtp, email);

    return res.json({
        status: 'PASSED',
        message: 'User found!',
      });

  } catch (error) {
    res.json({
      status: 'FAILED',
      message: 'An error occurred during password reset process!',
    });
  }
};

/**
 * API call for reset Issuer password.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const resetPassword = async (req, res) => {
  let { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user || !user.approved) {
      return res.json({
        status: 'FAILED',
        message: 'User not found (or) User not approved!',
      });
    }

    // Check if the new password is the same as the previous one
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.json({
        status: 'FAILED',
        message: 'Password cannot be the same as the previous one!',
      });
    }

    // Proceed with password handling
    const saltRounds = 10;
    bcrypt
      .hash(password, saltRounds)
      .then((hashedPassword) => {
        user.password = hashedPassword;
        user
          .save()
          .then(() => {
            res.json({
              status: "SUCCESS",
              message: "Password reset successful"
            });
          })
          .catch((err) => {
            res.json({
              status: "FAILED",
              message: "An error occurred while saving user account!",
            });
          });
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          message: "An error occurred while hashing password!",
        });
      });

  } catch (error) {
    res.json({
      status: 'FAILED',
      message: 'An error occurred during the password reset process!',
    });
  }
};

module.exports = {
    signup,
    login,
    twoFactor,
    forgotPassword,
    resetPassword,
    verifyIssuer,
    updateIssuer,
    loginPhoneNumber
}

