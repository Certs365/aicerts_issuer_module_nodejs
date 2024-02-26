
require('dotenv').config();
const app = require('express')();
const express = require("express");

const Web3 = require('web3');
const web3 = new Web3(process.env.RPC_URL);
// mongodb user model
const { User, Verification, Issues } = require("../config/schema");

const { sendEmail, generateAccount, generateOTP , isDBConncted, sendWelcomeMail } = require('../models/tasks');

// Password handler
const bcrypt = require("bcrypt");
const { generateJwtToken } = require('../utils/authUtils');


// Signup
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
    username,
  } = req.body;

  const accountDetails = await generateAccount();
  name = name.trim();
  organization = organization.trim();
  email = email.trim();
  password = password.trim();
  id = accountDetails;
  approved = false;

  // Validation for mandatory fields
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


// Login
const login = async (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  // const verify = await Verification.findOne({ email });
  // const generatedOtp = generateOTP();

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
                 // generate OTP and sending to the email
                // sendEmail(generatedOtp, email);

                // Save verification details
                // verify.code = generatedOtp;
                // verify.save();

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
                res.json({
                  status: "FAILED",
                  message: "Invalid password entered!",
                });
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

const verifyIssuer = async (req, res) => {
  let { email, code } = req.body;
  console.log(req.body)
  try {
    const verify = await Verification.findOne({ email });

    Verification.find({ email })
      .then((result) => {
        console.log(result,"res")
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
    verifyIssuer
}

