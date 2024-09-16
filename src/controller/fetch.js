// Load environment variables from .env file
require('dotenv').config();

// Importing functions from a custom module
const {
    isDBConnected // Function to check if the database connection is established
  } = require('../models/tasks'); // Importing functions from the '../model/tasks' module
  
  // Import MongoDB models
const { User, Issues, BatchIssues, IssueStatus, VerificationLog, ServiceAccountQuotas, DynamicIssues, DynamicBatchIssues, BulkBatchIssues } = require("../config/schema");

const messageCode = require("../common/codes");
  /**
   * API to do Health Check.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  const getAllIssuers = async (req, res) => {
    try {
        // Check mongoose connection
        const dbStatus = await isDBConnected();
        const dbStatusMessage = (dbStatus) ? messageCode.msgDbReady : messageCode.msgDbNotReady ;
        console.log(dbStatusMessage);
    
        // Fetch all users from the database
        const allIssuers = await User.find({ status: [1,2] }).select('-password -refreshToken');
        const allIssuerCount = allIssuers.length;
        
        const statusCounts = allIssuers.reduce((counts, item) => {
          if (item.status === 1) counts.status1++;
          if (item.status === 2) counts.status2++;
          return counts;
        }, { status1: 0, status2: 0 });
    
        const activeIssuerCount = statusCounts.status1;
        const inactiveIssuerCount = statusCounts.status2;
    
        res.json({
          code: 200,
          status: 'SUCCESS',
          allIssuers: allIssuerCount,
          activeIssuers: activeIssuerCount,
          inactiveIssuers: inactiveIssuerCount,
          data: allIssuers,
          message: messageCode.msgAllIssuersFetched
        });
      } catch (error) {
        // Error occurred while fetching user details, respond with failure message
        res.json({
          code: 400,
          status: 'FAILED',
          message: messageCode.msgErrorOnFetching
        });
      }
  };
  
  module.exports = {
    // Function to do Health Check
    getAllIssuers
  };
  