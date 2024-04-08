require('dotenv').config();

// mongodb user model
const { User, Verification, } = require("../config/schema");
const { sendEmail, generateOTP , isDBConnected } = require('../models/tasks');
const bcrypt = require("bcrypt");

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

  const updateIssuer = async (req, res) => {
    // Get id from req.body instead of req.query
    const { id } = req.body; 
    const updateFields = req.body;
  
    try {
        // Check mongoose connection
        const dbStatus = await isDBConnected();
        const dbStatusMessage = (dbStatus == true) ? "Database connection is Ready" : "Database connection is Not Ready";
        console.log(dbStatusMessage);
  
      // Find the issuer by IssuerId
      const existingIssuer = await User.findById({issuerId: id});
  
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
  

  module.exports = {
    forgotPassword,
    resetPassword,
    updateIssuer,
}