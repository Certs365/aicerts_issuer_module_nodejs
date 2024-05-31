require('dotenv').config();

const { validationResult } = require("express-validator");
var messageCode = require("../common/codes");

// mongodb user model
const { User, Verification } = require("../config/schema");
const { sendEmail, generateOTP , isDBConnected } = require('../models/tasks');
const bcrypt = require("bcrypt");

  /**
   * API call for forget Issuer password.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
const forgotPassword = async (req, res) => {
    var validResult = validationResult(req);
    if (!validResult.isEmpty()) {
      return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid ,details: validResult.array() });
    }
    let { email } = req.body;
    const generatedOtp = generateOTP();
    try {
      const verify = await Verification.findOne({ email });
  
      const user = await User.findOne({ email });
  
      if (!user || !user.approved) {
        return res.json({
          status: 'FAILED',
          message: messageCode.msgIssuerNotFound,
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
          message: messageCode.msgIssuerFound,
        });
  
    } catch (error) {
      res.json({
        status: 'FAILED',
        message: messageCode.msgErroOnPwdReset,
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
    var validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid ,details: validResult.array() });
    }
    let { email, password } = req.body;
    try {
     // Check mongoose connection
     const dbStatus = await isDBConnected();
     const dbStatusMessage = (dbStatus == true) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
     console.log(dbStatusMessage);
      const user = await User.findOne({ email });
  
      if (!user || !user.approved) {
        return res.json({
          status: 'FAILED',
          message: messageCode.msgIssuerNotFound
        });
      }
  
      // Check if the new password is the same as the previous one
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        return res.json({
          status: 'FAILED',
          message: messageCode.msgPwdNotSame
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
                message: messageCode.msgPwdReset
              });
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: messageCode.msgErrorOnSaveUser
              });
            });
        })
        .catch((err) => {
          res.json({
            status: "FAILED",
            message: messageCode.msgErrorOnPwdHash
          });
        });
  
    } catch (error) {
      res.json({
        status: 'FAILED',
        message: messageCode.msgErroOnPwdReset
      });
    }
  };

  /**
   * API call for update Issuer details.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  const updateIssuer = async (req, res) => {
    var validResult = validationResult(req);
    if (!validResult.isEmpty()) {
      return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid ,details: validResult.array() });
    }
    // Get id from req.body instead of req.query
    const { id } = req.body; 
    const updateFields = req.body;
  
    try {
        // Check mongoose connection
        const dbStatus = await isDBConnected();
        const dbStatusMessage = (dbStatus == true) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
        console.log(dbStatusMessage);
  
      // Find the issuer by IssuerId
      const existingIssuer = await User.findById({issuerId: id});
  
      if (!existingIssuer) {
        res.json({
          status: "FAILED",
          message: messageCode.msgIssuerNotFound,
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
        message: messageCode.msgIssuerUpdated,
        data: updatedIssuer,
      });
    } catch (error) {
      console.error(error);
      res.json({
        status: "FAILED",
        message: messageCode.msgInternalError,
      });
    }
  };
  

  module.exports = {
    forgotPassword,
    resetPassword,
    updateIssuer,
}