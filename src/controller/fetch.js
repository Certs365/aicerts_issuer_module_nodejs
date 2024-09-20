// Load environment variables from .env file
require('dotenv').config();

const moment = require('moment');
// Importing functions from a custom module
const {
  isDBConnected // Function to check if the database connection is established
} = require('../models/tasks'); // Importing functions from the '../model/tasks' module

// Import MongoDB models
const { User, Issues, BatchIssues, IssueStatus, VerificationLog, ServiceAccountQuotas, DynamicIssues, DynamicBatchIssues, CrediantialTemplate } = require("../config/schema");

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
    const dbStatusMessage = (dbStatus) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
    console.log(dbStatusMessage);

    // Fetch all users from the database
    // Fetch all users from the database
    const allIssuers = await User.find({ status: [0,1,2] }).select('-password');
    const allIssuerCount = allIssuers.length;

    const statusCounts = allIssuers.reduce((counts, item) => {
      if (item.status === 0) counts.status0++;
      if (item.status === 1) counts.status1++;
      if (item.status === 2) counts.status2++;
      return counts;
    }, { status0: 0, status1: 0, status2: 0 });

    const pendingIssuerCount = statusCounts.status0;
    const activeIssuerCount = statusCounts.status1;
    const inactiveIssuerCount = statusCounts.status2;

    res.json({
      code: 200,
      status: 'SUCCESS',
      allIssuers: allIssuerCount,
      activeIssuers: activeIssuerCount,
      inactiveIssuers: inactiveIssuerCount,
      pendingIssuers: pendingIssuerCount,
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

/**
* API to do Health Check.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const getAdminGraphDetails = async (req, res) => {
  const _year = req.params.year; // Get the value from the URL parameter

  const year = parseInt(_year);
  // Check if value is between 1 and 12 and equal to 2024
  if ((year !== null && year !== '') && // Check if value is not null or empty
    (year < 2000 || year > 9999)) {
    // Send the fetched graph data as a response
    return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidGraphInput, details: year });
  }
  // Check mongoose connection
  const dbStatus = await isDBConnected();
  const dbStatusMessage = (dbStatus == true) ? "Database connection is Ready" : "Database connection is Not Ready";
  console.log(dbStatusMessage);

  if (dbStatus == false) {
    return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgDbNotReady });
  }

  try {
    var fetchAnnualIssues = await IssueStatus.find({
      certStatus: { $eq: 1 }
    }).lean();

    var fetchAnnualIssuers = await User.find({
      approveDate: { $ne: null }
    }).lean();

    var getIssuersDetailsMonthCount = await getAggregatedCertsDetails(fetchAnnualIssuers, year, 1);
    var getIssuesDetailsMonthCount = await getAggregatedCertsDetails(fetchAnnualIssues, year, 2);
    const mergedDetails = getIssuersDetailsMonthCount.map((singleItem, index) => ({
      month: singleItem.month,
      count: [singleItem.count, getIssuesDetailsMonthCount[index].count]
    }));

    var responseData = mergedDetails.length == 12 ? mergedDetails : 0;

    // Send the fetched graph data as a response
    res.json({
      code: 200,
      status: "SUCCESS",
      message: messageCode.msgGraphDataFetched,
      data: responseData,
    });
    return;
  } catch (error) {
    return res.status(500).json({ code: 500, status: "FAILED", message: messageCode.msgInternalError, details: error });
  }
};


const getAggregatedCertsDetails = async (data, year, type) => {
  // Function to extract month and year from lastUpdate field
  const getMonthYear = (entry) => {
    const date = moment(entry.lastUpdate);
    const year = date.year();
    return year;
  };
  // Filter data for the specified year
  const dataYear = data.filter(entry => {
    const entryYear = getMonthYear(entry);
    return entryYear === year;
  });

  // Count occurrences of each month
  var monthCounts = {};
  var month;
  if (type == 2) {
    dataYear.forEach(entry => {
      month = moment(entry.lastUpdate).month() + 1; // Adding 1 because moment.js months are 0-indexed
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
  } else {
    dataYear.forEach(entry => {
      month = moment(entry.approveDate).month() + 1; // Adding 1 because moment.js months are 0-indexed
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
  }

  // Create array with counts for all months in the specified year
  const monthCountsArray = [];
  for (let i = 1; i <= 12; i++) {
    monthCountsArray.push({ month: i, count: monthCounts[i] || 0 });
  }
  return monthCountsArray;
};


const addCertificateTemplate = async (req, res) => {

  let { url, email,designFields  } = req.body;
  try {
      const user = await User.findOne({ email:email , status:1});
      
      if (!user) {
          return res.status(400).json({
              status: "FAILED",
              message: messageCode.msgErrorOnFetching,
          });
      }

      const templateDetails =new CrediantialTemplate({
        email:email,
        designFields:designFields,
        url:url
      })
      const savedTemplate = await templateDetails.save();
      

      res.json({
          status: "PASSED",
          message: messageCode.msgVerfySuccess,
          data:savedTemplate
      });

  } catch (error) {
      console.error(messageCode.msgVerifyError, error);
      res.status(500).json({
          status: 'FAILED',
          message: messageCode.msgVerifyError
      });
  }
};

const getCertificateTemplates = async (req, res) => {
  const { email } = req.body;  // Expecting email in the request body

  try {
    // Find all templates associated with the provided email
    const templates = await CrediantialTemplate.find({ email });

    // If no templates are found, return an appropriate response
    if (!templates.length) {
      return res.status(404).json({
        status: "FAILED",
        message: "No templates found for the provided email.",
      });
    }

    // Return the found templates
    res.json({
      status: "PASSED",
      message: "Templates fetched successfully.",
      data: templates,
    });
    
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      status: 'FAILED',
      message: 'Error fetching templates.',
    });
  }
};

const updateCertificateTemplate = async (req, res) => {
  const { id, url, designFields } = req.body; // Expecting template ID and update details

  try {
    // Find the template by its ID
    const template = await CrediantialTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        status: "FAILED",
        message: "Template not found.",
      });
    }

    // Update the template fields
    template.url = url || template.url; // Only update if a new URL is provided
    template.designFields = designFields || template.designFields; // Update designFields if provided

    // Save the updated template
    const updatedTemplate = await template.save();

    // Respond with the updated template
    res.json({
      status: "PASSED",
      message: "Template updated successfully.",
      data: updatedTemplate,
    });

  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      status: "FAILED",
      message: "Error updating template.",
    });
  }
};



module.exports = {
  // Function to do Health Check
  getAllIssuers,
  updateCertificateTemplate,
  getAdminGraphDetails,
  addCertificateTemplate,
  getCertificateTemplates
};
