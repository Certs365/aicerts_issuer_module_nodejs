// Load environment variables from .env file
require('dotenv').config();

const moment = require('moment');
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { Readable } = require('stream');
const { validationResult } = require("express-validator");
// Importing functions from a custom module
const {
  formatDate,
  isDBConnected, // Function to check if the database connection is established
  parseDate,
  readableDateFormat,
  cerateInvoiceNumber,
  isValidIssuer
} = require('../models/tasks'); // Importing functions from the '../model/tasks' module

const {
  _getAggregatedCertsDetails,
} = require('../utils/customModules');

// Import MongoDB models
const { Admin, User, Issues, BatchIssues, IssueStatus, CrediantialTemplate, ServiceAccountQuotas, DynamicIssues, DynamicBatchIssues, ServerDetails, VerificationLog } = require("../config/schema");

const messageCode = require("../common/codes");

const cloudBucket = '.png';
const searchLimit = process.env.SEARCH_LIMIT || 20;

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
    const allIssuers = await User.find({ status: [0, 1, 2, 3] }).select('-password');
    const allIssuerCount = allIssuers.length;
    if (!allIssuers) {
      return res.json({
        code: 400,
        status: 'FAILED',
        message: messageCode.msgNoMatchFound
      });
    }

    const statusCounts = allIssuers.reduce((counts, item) => {
      if (item.status === 0) counts.status0++;
      if (item.status === 1) counts.status1++;
      if (item.status === 2) counts.status2++;
      if (item.status === 3) counts.status3++;
      return counts;
    }, { status0: 0, status1: 0, status2: 0, status3: 0 });

    const pendingIssuerCount = statusCounts.status0;
    const activeIssuerCount = statusCounts.status1;
    const inactiveIssuerCount = statusCounts.status2;
    const rejectedIssuerCount = statusCounts.status3;

    let totalMaticSpent = allIssuers.reduce((total, item) => total + item.transactionFee, 0);
    // Restrict to 10 decimal places
    let maticSpent = parseFloat(totalMaticSpent.toFixed(10));

    res.json({
      code: 200,
      status: 'SUCCESS',
      message: messageCode.msgAllIssuersFetched,
      allIssuers: allIssuerCount,
      activeIssuers: activeIssuerCount,
      inactiveIssuers: inactiveIssuerCount,
      pendingIssuers: pendingIssuerCount,
      rejectedIssuers: rejectedIssuerCount,
      maticSpent: maticSpent,
      data: allIssuers
    });
    return;
  } catch (error) {
    // Error occurred while fetching user details, respond with failure message
    return res.json({
      code: 500,
      status: 'FAILED',
      message: messageCode.msgErrorOnFetching
    });
  }
};

/**
 * API to fetch details of Issuer.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getIssuerByEmail = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  try {
    // Check mongoose connection
    const dbStatus = await isDBConnected();
    const dbStatusMessage = (dbStatus == true) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
    console.log(dbStatusMessage);

    const { email } = req.body;

    const issuer = await User.findOne({ email: email }).select('-password');

    if (issuer) {
      res.json({
        code: 200,
        status: 'SUCCESS',
        data: issuer,
        message: `Issuer with email ${email} fetched successfully`
      });
    } else {
      res.json({
        code: 400,
        status: 'FAILED',
        message: `Issuer with email ${email} not found`
      });
    }
  } catch (error) {
    res.json({
      code: 500,
      status: 'FAILED',
      message: messageCode.msgErrorOnFetching
    });
  }
};

/**
* API to get server details.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const fetchServerDetails = async (req, res) => {
  try {
    const getServeDetails = await ServerDetails.find({ email: { $ne: null } });

    if (!getServeDetails || getServeDetails.length == 0) {
      return res.json({
        code: 400,
        status: 'FAILED',
        message: messageCode.msgNoMatchFound
      });
    }

    // Sort the data based on the 'lastUpdate' date in descending order
    getServeDetails.sort((b, a) => new Date(a.lastUpdate) - new Date(b.lastUpdate));

    return res.json({
      code: 200,
      status: 'SUCCESS',
      message: messageCode.msgMatchFound,
      data: getServeDetails
    });

  } catch (error) {
    console.error("An error occured", error);
    return res.json({
      code: 500,
      status: 'FAILED',
      message: messageCode.msgErrorOnFetching
    });
  }
};

/**
* API to put server details.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const uploadServerDetails = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  const { email, serverName, serverEndpoint, serverAddress } = req.body;

  if (!email || !serverName || !serverEndpoint || !serverAddress) {
    return res.json({
      code: 400,
      status: 'FAILED',
      message: messageCode.msgEnterInvalid
    });
  }
  await isDBConnected();

  const isAdminExist = await Admin.findOne({ email: email });
  if (!isAdminExist) {
    return res.json({
      code: 400,
      status: 'FAILED',
      message: messageCode.msgAdminMailNotExist
    });
  }

  const serverNameExist = await ServerDetails.findOne({ serverName: serverName });
  if (serverNameExist) {
    return res.json({
      code: 400,
      status: 'FAILED',
      message: messageCode.msgServerNameExist
    });
  }

  try {
    const uploadDetails = new ServerDetails({
      email: email,
      serverName: serverName,
      serverEndpoint: serverEndpoint,
      serverAddress: serverAddress,
      lastUpdate: Date.now()
    });
    await uploadDetails.save();

    return res.json({
      code: 200,
      status: 'SUCCESS',
      message: messageCode.msgOperationSuccess,
      data: uploadDetails
    });

  } catch (error) {
    console.error("An error occured", error);
    return res.json({
      code: 500,
      status: 'FAILED',
      message: messageCode.msgErrorOnFetching
    });
  }
};

/**
* API to delete server details.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const deleteServerDetails = async (req, res) => {
  const { serverName } = req.body;

  if (!serverName) {
    return res.status(400).json({
      code: 400,
      status: 'FAILED',
      message: messageCode.msgInputProvide
    });
  }

  const serverNameExist = await ServerDetails.findOne({ serverName: serverName });
  if (!serverNameExist) {
    return res.status(400).json({
      code: 400,
      status: 'FAILED',
      message: messageCode.msgServerNameNotExist
    });
  }
  // Delete the found server details
  try {
    await ServerDetails.deleteOne({ serverName: serverName });
    return res.status(200).json({
      code: 200,
      status: 'SUCCESS',
      message: messageCode.msgServerDeleted
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: 'FAILED',
      message: messageCode.msgInternalError
    });
  }
};

/**
 * API to fetch Service limits details of Issuer .
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getServiceLimitsByEmail = async (req, res) => {
  let validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  try {
    // Check mongoose connection
    const dbStatus = await isDBConnected();
    const dbStatusMessage = (dbStatus == true) ? messageCode.msgDbReady : messageCode.msgDbNotReady;
    console.log(dbStatusMessage);

    const { email } = req.body;

    const issuerExist = await User.findOne({ email: email });
    if (!issuerExist || !issuerExist.issuerId) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidIssuer, details: email });
    }

    var fetchServiceQuota = await ServiceAccountQuotas.find({
      issuerId: issuerExist.issuerId
    });

    if (!fetchServiceQuota || fetchServiceQuota.length < 1) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgMatchLimitsNotFound, details: email });
    }

    // Transform the original response
    let transformedResponse = fetchServiceQuota.map(item => ({
      serviceId: item.serviceId,
      limit: item.limit,
      status: item.status
    }));

    return res.status(200).json({ code: 200, status: "SUCCESS", message: messageCode.msgMatchLimitsFound, details: transformedResponse });

  } catch (error) {
    res.json({
      code: 400,
      status: 'FAILED',
      message: messageCode.msgErrorOnFetching
    });
  }
};

/**
 * API to fetch details of Verification results input as Course name.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getVerificationDetailsByCourse = async (req, res) => {
  let validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  try {

    const email = req.body.email;
    // Check mongoose connection
    const dbStatus = await isDBConnected();

    const isEmailExist = await User.findOne({ email: email });

    if (!isEmailExist) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgUserEmailNotFound });
    }

    const verificationCommonResponse = await VerificationLog.findOne({ email: email });
    if (verificationCommonResponse) {
      var responseCount = verificationCommonResponse.courses;
      res.status(200).json({
        code: 200,
        status: 'SUCCESS',
        data: responseCount,
        message: messageCode.msgFetchedVerificationCourses
      });
      return;
    } else {
      res.status(400).json({
        code: 400,
        status: 'FAILED',
        data: 0,
        message: messageCode.msgNoMatchFound
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: 'FAILED',
      data: error,
      message: messageCode.msgErrorOnFetching
    });
  }
};

/**
* API to get Issues/Issuers count on month wise.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const getAdminGraphDetails = async (req, res) => {
  const _year = req.params.year; // Get the value from the URL parameter

  const year = parseInt(_year);
  // Check if value is between 1 and 12 and equal to 2024
  if ((year !== null && year !== '') && // Check if value is not null or empty
    (year < 2020 || year > 2099)) {
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
    const certificates = await IssueStatus.find(
      { certStatus: 1 },
      { lastUpdate: 1, certStatus: 1, /* other necessary fields */ }
    ).lean();

    var fetchAnnualIssues = certificates.filter(cert => cert.certStatus === 1);

    var fetchAnnualIssuers = await User.find({
      approveDate: { $ne: null }
    }).lean();

    console.log("Reached", fetchAnnualIssues.length);
    if (!fetchAnnualIssues && !fetchAnnualIssuers) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgDbNotReady });
    }

    var getIssuersDetailsMonthCount = await _getAggregatedCertsDetails(fetchAnnualIssuers, year, 1);
    var getIssuesDetailsMonthCount = await _getAggregatedCertsDetails(fetchAnnualIssues, year, 2);
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

/**
* API to add custom certificate/credential template.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const addCertificateTemplate = async (req, res) => {

  let { url, email, designFields } = req.body;
  try {
    const user = await User.findOne({ email: email, status: 1 });

    if (!user) {
      return res.status(400).json({
        status: "FAILED",
        message: messageCode.msgInvalidIssuer,
      });
    }

    const templateDetails = new CrediantialTemplate({
      email: email,
      designFields: designFields,
      url: url
    })
    const savedTemplate = await templateDetails.save();


    res.json({
      code: 200,
      status: "SUCCESS",
      message: messageCode.msgOperationSuccess,
      data: savedTemplate
    });

  } catch (error) {
    console.error(messageCode.msgInternalError, error);
    res.status(500).json({
      code: 400,
      status: 'FAILED',
      message: messageCode.msgInternalError
    });
  }
};

/**
* API to get certificate/credential template.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
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
      status: "SUCCESS",
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

/**
* API to update certificate/credential template.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const updateCertificateTemplate = async (req, res) => {
  const { id, url, designFields } = req.body; // Expecting template ID and update details

  try {
    // Find the template by its ID
    const template = await CrediantialTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        code: 404,
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
      code: 200,
      status: "SUCCESS",
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

/**
* API to delete certificate/credential templates.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const deleteCertificateTemplates = async (req, res) => {
  const { email } = req.body;  // Expecting email in the request body

  try {
    // Find and delete templates associated with the provided email
    const result = await CrediantialTemplate.deleteMany({ email });

    // If no templates are found and deleted, return an appropriate response
    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: "FAILED",
        message: "No templates found for the provided email.",
      });
    }

    // Return success response after deleting
    res.json({
      status: "SUCCESS",
      message: `${result.deletedCount} template(s) deleted successfully.`,
    });

  } catch (error) {
    console.error("Error deleting templates:", error);
    res.status(500).json({
      status: 'FAILED',
      message: 'Error deleting templates.',
    });
  }
};

/**
* API to delete a certificate/credential template by certificateId.
*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const deleteCertificateTemplateById = async (req, res) => {
  const { certificateId } = req.body;  // Expecting certificateId in the request body

  try {
    // Find and delete the template by certificateId
    const result = await CrediantialTemplate.findOneAndDelete({ _id: certificateId });

    // If no template is found, return an appropriate response
    if (!result) {
      return res.status(404).json({
        status: "FAILED",
        message: "No template found for the provided certificateId.",
      });
    }

    // Return success response after deleting
    res.json({
      status: "SUCCESS",
      message: "Template deleted successfully.",
    });

  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({
      status: 'FAILED',
      message: 'Error deleting template.',
    });
  }
};

/**
 * API call to fetch DB file and generate reports into excel file format.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const generateExcelReport = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  try {
    const { startDate, endDate, email } = req.body;
    if (!startDate || !endDate || !email) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgInputProvide,
      });
    }

    const dbStatus = isDBConnected();
    if (!dbStatus) {
      return res.status(500).json({
        code: 500,
        status: "FAILED",
        message: messageCode.msgDbNotReady,
      });
    }

    const isEmailExist = await User.findOne({ email: email });
    if (!isEmailExist) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgInvalidEmail,
        details: email,
      });
    }
    const issuerId = isEmailExist.issuerId;
    const start = await parseDate(startDate);
    const end = await parseDate(endDate);

    if (start > end) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgStartDateShouldOld,
        details: `Start Date : ${start}, End date: ${end}`,
      });
    }

    console.log("the data input", startDate, endDate, email, start, end, start < end);
    const readableStartDate = await readableDateFormat(startDate);
    const readableEndDate = await readableDateFormat(endDate);

    const [
      issuesFetch,
      dynamicfetch,
      dynamicbatchfetch,
      batchfetch,
      statuslogs,
    ] = await Promise.all([
      Issues.find({ issuerId, issueDate: { $gte: start, $lte: end } }),
      DynamicIssues.find({ issuerId, issueDate: { $gte: start, $lte: end } }),
      DynamicBatchIssues.find({
        issuerId,
        issueDate: { $gte: start, $lte: end },
      }),
      BatchIssues.find({ issuerId, issueDate: { $gte: start, $lte: end } }),
      IssueStatus.find({ issuerId, lastUpdate: { $gte: start, $lte: end } }),
    ]);

    const getCount = (array, type, status) => {
      if (type != "") {
        return array.filter(
          (item) => item.type === type && item.certificateStatus === status
        ).length;
      } else {
        return array.filter((item) => item.certificateStatus === status).length;
      }
    };

    const data = {
      issuername: isEmailExist.name,
      issuerId,
      email,
      organization: isEmailExist.organization,
      designation: isEmailExist.designation,
      startDate,
      endDate,
      withpdfreactivate: getCount(issuesFetch, "withpdf", 4),
      withoutpdfreactivate: getCount(issuesFetch, "withoutpdf", 4),
      batchreactivate: getCount(batchfetch, "", 4),
      dynamicreactivate: getCount(dynamicfetch, "", 4),
      dynamicbatchreactivate: getCount(dynamicbatchfetch, "", 4),
      withpdfrevoke: getCount(issuesFetch, "withpdf", 3),
      withoutpdfrevoke: getCount(issuesFetch, "withoutpdf", 3),
      batchrevoke: getCount(batchfetch, "", 3),
      dynamicrevoke: getCount(dynamicfetch, "", 3),
      dynamicbatchrevoke: getCount(dynamicbatchfetch, "", 3),
      withpdfrenew: getCount(issuesFetch, "withpdf", 2),
      withoutpdfrenew: getCount(issuesFetch, "withoutpdf", 2),
      batchrenew: getCount(batchfetch, "", 2),
      dynamicrenew: getCount(dynamicfetch, "", 2),
      dynamicbatchrenew: getCount(dynamicbatchfetch, "", 2),
      Totalrevokecount: statuslogs.filter((item) => item.certStatus === 3)
        .length,
      Totalrenewcount: statuslogs.filter((item) => item.certStatus === 2)
        .length,
      Totalreactivatecount: statuslogs.filter((item) => item.certStatus === 4)
        .length,
      withpdf: issuesFetch.filter((item) => item.type === "withpdf").length,
      withoutpdf: issuesFetch.filter((item) => item.type === "withoutpdf")
        .length,
      batchfetch: batchfetch.length,
      dynamicfetch: dynamicfetch.length,
      dynamicbatchfetch: dynamicbatchfetch.length,
      Totalissues:
        issuesFetch.filter((item) => item.type === "withpdf").length +
        issuesFetch.filter((item) => item.type === "withoutpdf").length +
        batchfetch.length +
        dynamicfetch.length +
        dynamicbatchfetch.length,
      withpdfcourses: [
        ...new Set(
          issuesFetch
            .filter((item) => item.type === "withpdf")
            .map((item) => item.course)
        ),
      ],
      withoutpdfcourses: [
        ...new Set(
          issuesFetch
            .filter((item) => item.type === "withoutpdf")
            .map((item) => item.course)
        ),
      ],
      batchcourses: [...new Set(batchfetch.map((item) => item.course))],
      dynamiccourses: [...new Set(dynamicfetch.map((item) => item.course))],
      dynamicbatchcourses: [
        ...new Set(dynamicbatchfetch.map((item) => item.course)),
      ],
      withpdfcerts: [
        ...issuesFetch
          .filter((item) => item.type === "withpdf")
          .map(
            ({
              certificateNumber,
              name,
              course,
              grantDate,
              expirationDate,
              certificateStatus,
            }) => {
              let Status;
              if (certificateStatus == 1) Status = "Active";
              else if (certificateStatus == 2) Status = "Renewed";
              else if (certificateStatus == 3) Status = "Revoked";
              else if (certificateStatus == 4) Status = "Reactivated";
              return {
                certificateNumber,
                name,
                course,
                grantDate,
                expirationDate,
                Status,
                Type: "WithPDF",
              };
            }
          ),
      ],
      withoutpdfcerts: [
        ...issuesFetch
          .filter((item) => item.type === "withoutpdf")
          .map(
            ({
              certificateNumber,
              name,
              course,
              grantDate,
              expirationDate,
              certificateStatus,
            }) => {
              let Status;
              if (certificateStatus == 1) Status = "Active";
              else if (certificateStatus == 2) Status = "Renewed";
              else if (certificateStatus == 3) Status = "Revoked";
              else if (certificateStatus == 4) Status = "Reactivated";
              return {
                certificateNumber,
                name,
                course,
                grantDate,
                expirationDate,
                Status,
                Type: "withoutPDF",
              };
            }
          ),
      ],
      batchcerts: [
        ...batchfetch.map(
          ({
            certificateNumber,
            name,
            course,
            grantDate,
            expirationDate,
            certificateStatus,
          }) => {
            let Status;
            if (certificateStatus == 1) Status = "Active";
            else if (certificateStatus == 2) status = "Renewed";
            else if (certificateStatus == 3) Status = "Revoked";
            else if (certificateStatus == 4) Status = "Reactivated";
            return {
              certificateNumber,
              name,
              course,
              grantDate,
              expirationDate,
              Status,
              Type: "batch",
            };
          }
        ),
      ],
      dynamiccerts: [
        ...dynamicfetch.map(
          ({ certificateNumber, name, certificateStatus }) => {
            let Status;
            if (certificateStatus == 1) Status = "Active";
            else if (certificateStatus == 2) Status = "Renewed";
            else if (certificateStatus == 3) Status = "Revoked";
            else if (certificateStatus == 4) Status = "Reactivated";
            return {
              certificateNumber,
              name,
              Status,
              Type: "dynamic",
            };
          }
        ),
      ],
      dynamicbatchcerts: [
        ...dynamicbatchfetch.map(
          ({ certificateNumber, name, certificateStatus }) => {
            let Status;
            if (certificateStatus == 1) Status = "Active";
            else if (certificateStatus == 2) Status = "Renewed";
            else if (certificateStatus == 3) Status = "Revoked";
            else if (certificateStatus == 4) Status = "Reactivated";
            return {
              certificateNumber,
              name,
              Status,
              Type: "dynamicBatch",
            };
          }
        ),
      ],
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet1 = workbook.addWorksheet("Report");

    // Create a bar chart image using QuickChart API
    const generateChartImage = async () => {
      const { default: fetch } = await import("node-fetch");
      const chartConfig = {
        type: "bar",
        data: {
          labels: ["Reactivate", "Revoke", "Renew", "Issued"],
          datasets: [
            {
              label: "With PDF",
              data: [
                data.withpdfreactivate,
                data.withpdfrevoke,
                data.withpdfrenew,
                data.withpdf,
              ],
              backgroundColor: "rgba(247, 232, 131, 1)",
            },
            {
              label: "Without PDF",
              data: [
                data.withoutpdfreactivate,
                data.withoutpdfrevoke,
                data.withoutpdfrenew,
                data.withoutpdf,
              ],
              backgroundColor: "rgba(247, 182, 2, 0.8)",
            },
            {
              label: "Batch",
              data: [
                data.batchreactivate,
                data.batchrevoke,
                data.batchrenew,
                data.batchfetch,
              ],
              backgroundColor: "rgba(255, 211, 15, 1)",
            },
            {
              label: "Dynamic",
              data: [
                data.dynamicreactivate,
                data.dynamicrevoke,
                data.dynamicrenew,
                data.dynamicfetch,
              ],
              backgroundColor: "rgba(173, 142, 0, 1)",
            },
            {
              label: "Dynamic Batch",
              data: [
                data.dynamicbatchreactivate,
                data.dynamicbatchrevoke,
                data.dynamicbatchrenew,
                data.dynamicbatchfetch,
              ],
              backgroundColor: "rgba(242, 166, 65, 1)",
            },
          ],
        },
        options: {
          scales: {
            x: {
              ticks: {
                font: {
                  weight: "bold", // Make x-axis labels bold
                },
              },
              grid: {
                borderWidth: 2, // Make x-axis border line thicker
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: {
                  weight: "bold", // Make y-axis labels bold
                },
              },
              grid: {
                borderWidth: 2, // Make y-axis border line thicker
              },
            },
          },
          plugins: {
            legend: {
              labels: {
                font: {
                  weight: "bold", // Make legend labels bold
                },
              },
            },
          },
        },
      };

      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(
        JSON.stringify(chartConfig)
      )}`;
      const response = await fetch(chartUrl);
      const buffer = await response.arrayBuffer();

      return buffer; // Return the image as binary data
    };

    function addHeading(text, worksheet) {
      const row = worksheet.addRow([text]);
      row.alignment = { horizontal: "center" };
      for (let i = 1; i <= 6; i++) {
        const cell = row.getCell(i);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF033" }, // Yellow color
        };
      }
      worksheet.mergeCells(`A${row.number}:F${row.number}`);
      row.font = { bold: true, size: 15 };
      return row;
    }

    addHeading("Issuer Details", worksheet1);

    const issuerDetails = [
      ["Issuer Name", data.issuername],
      ["Organization", data.organization],
      ["Designation", data.designation],
      ["Issuer ID", data.issuerId],
      ["Email", data.email],
      ["Start Date", readableStartDate],
      ["End Date", readableEndDate],
    ];

    issuerDetails.forEach((row) => {
      const dataRow = worksheet1.addRow(row);
      dataRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" }, // Light grey
      };
      dataRow.getCell(1).font = { bold: true };
      dataRow.getCell(2).font = { bold: true };
    });

    worksheet1.addRow([]);

    let row = await addHeading("Usage", worksheet1);

    const headers = [
      "",
      "With PDF",
      "Without PDF",
      "Batch",
      "Dynamic",
      "Dynamic Batch",
    ];
    const headerRow = worksheet1.addRow(headers);
    headerRow.alignment = { horizontal: "center" };

    const rows = [
      [
        "Reactivate",
        data.withpdfreactivate,
        data.withoutpdfreactivate,
        data.batchreactivate,
        data.dynamicreactivate,
        data.dynamicbatchreactivate,
      ],
      [
        "Revoke",
        data.withpdfrevoke,
        data.withoutpdfrevoke,
        data.batchrevoke,
        data.dynamicrevoke,
        data.dynamicbatchrevoke,
      ],
      [
        "Renew",
        data.withpdfrenew,
        data.withoutpdfrenew,
        data.batchrenew,
        data.dynamicrenew,
        data.dynamicbatchrenew,
      ],
      [
        "Issued",
        data.withpdf,
        data.withoutpdf,
        data.batchfetch,
        data.dynamicfetch,
        data.dynamicbatchfetch,
      ],
    ];

    rows.forEach((rowData, rowIndex) => {
      const row = worksheet1.addRow(rowData);
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: rowIndex === 0 ? "medium" : "thin" },
          left: { style: colNumber === 1 ? "medium" : "thin" },
          bottom: { style: rowIndex === rows.length - 1 ? "medium" : "thin" },
          right: { style: colNumber === headers.length ? "medium" : "thin" },
        };
      });
      row.alignment = { horizontal: "center" };
    });

    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" }, // Light grey
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet1
      .getColumn(1)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 6) {
          cell.font = { bold: true };
        }
      });

    worksheet1.getColumn(1).width = 25;
    worksheet1.getColumn(2).width = 20;
    worksheet1.getColumn(3).width = 20;
    worksheet1.getColumn(4).width = 20;
    worksheet1.getColumn(5).width = 20;
    worksheet1.getColumn(6).width = 20;

    row.font = { bold: true, size: 15 };
    worksheet1.addRow([]);

    addHeading("Total Counts", worksheet1);
    const totalCounts = [
      ["Total Revoke Operations", data.Totalrevokecount],
      ["Total Renew Operations", data.Totalrenewcount],
      ["Total Reactivate Operations", data.Totalreactivatecount],
      ["Total Issued Certs", data.Totalissues],
    ];

    totalCounts.forEach((row) => {
      const dataRow = worksheet1.addRow(row);
      dataRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" }, // Light grey
      };
      dataRow.getCell(1).font = { bold: true };
      dataRow.getCell(2).font = { bold: true };
      dataRow.alignment = { horizontal: "center" };
    });
    worksheet1.addRow([]);
    // Courses Section
    addHeading("Courses Section", worksheet1);

    // Define courses data
    const courseCategories = {
      "With PDF Courses": data.withpdfcourses,
      "Without PDF Courses": data.withoutpdfcourses,
      "Batch Courses": data.batchcourses,
      "Dynamic Courses": data.dynamiccourses,
      "Dynamic Batch Courses": data.dynamicbatchcourses,
    };

    // Add table headers for categories
    const categories = Object.keys(courseCategories);
    worksheet1.addRow(["S.No", ...categories]);

    // Determine the maximum number of courses in any category
    const maxCourses = Math.max(
      ...Object.values(courseCategories).map((courses) => courses.length)
    );

    // Add courses data to the table
    for (let i = 0; i < maxCourses; i++) {
      let row = [i + 1]; // Row number for course index
      categories.forEach((category) => {
        row.push(courseCategories[category][i] || ""); // Add course or empty string if not available
      });
      row = worksheet1.addRow(row);
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      row.alignment = { horizontal: "center" };
    }

    // Style the header row
    const headerRow2 = worksheet1.getRow(22);
    headerRow2.alignment = { horizontal: "center" };
    headerRow2.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" }, // Light grey
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet1.addRow([]);

    const chartImageBuffer = await generateChartImage();

    // Add chart image to the worksheet
    const imageId = workbook.addImage({
      buffer: chartImageBuffer, // Use buffer data instead of filename
      extension: "png",
    });

    addHeading("Charts", worksheet1)
    worksheet1.addRow([]);

    // Add image to the worksheet at a specific position
    worksheet1.addImage(imageId, `A${worksheet1.lastRow.number}:F${worksheet1.lastRow.number + 20}`);

    function addHeading2(text, worksheet) {
      const row = worksheet.addRow([text]);

      row.alignment = { horizontal: "center" };

      for (let i = 1; i <= 6; i++) {
        const cell = row.getCell(i);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF033" }, // Yellow color
        };
      }

      worksheet.mergeCells(`A${row.number}:G${row.number}`);
      row.font = { bold: true, size: 15 };
      return row;
    }

    function addcerts(data, headings, worksheet) {
      worksheet.getColumn(1).width = 25;
      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 20;
      worksheet.getColumn(5).width = 20;
      worksheet.getColumn(6).width = 20;
      worksheet.getColumn(7).width = 20
      let headers3 = headings;
      let headerRow3 = worksheet.addRow(headers3);
      headerRow3.alignment = { horizontal: "center" };
      headerRow3.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD3D3D3" }, // Light grey
        };
        cell.font = { bold: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      data.forEach((item) => {
        let row = [];
        headings.forEach((header) => {
          row.push(item[header] || null); // Insert the value if it exists, or null if it doesn't
        });
        row = worksheet.addRow(row);
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        row.alignment = { horizontal: "center" }; // Add the row to the worksheet
      });

    }

    const worksheet2 = workbook.addWorksheet("Details");

    addHeading2("Details", worksheet2)
    let certsdata = [
      ...data.withpdfcerts,
      ...data.withoutpdfcerts,
      ...data.batchcerts,
      ...data.dynamiccerts,
      ...data.dynamicbatchcerts,
    ];
    addcerts(
      certsdata,
      [
        "certificateNumber",
        "name",
        "course",
        "grantDate",
        "expirationDate",
        "Status",
        "Type",
      ],
      worksheet2
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Report_${Date.now()}.xlsx`
    );

    // Stream the workbook to the response
    await workbook.xlsx.write(res);

    // End the response after sending the file
    res.end();

  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({
      code: 500,
      status: "FAILED",
      message: messageCode.msgUnableToGenerateRepoert,
    });
  }
};

/**
 * API call to generate invoice in pdf format.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const generateInvoiceDocument = async (req, res) => {
  var validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  try {
    const { email, startDate, endDate } = req.body
    if (!email || !startDate || !endDate) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgEnterInvalid,
      });
    }

    const start = await parseDate(startDate);
    const end = await parseDate(endDate);
    if (start > end) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgStartDateShouldOld,
        details: `Start Date : ${start}, End date: ${end}`,
      });
    }

    const readableEndDate = await readableDateFormat(endDate);

    const dbStatus = isDBConnected();
    if (!dbStatus) {
      return res.status(500).json({
        code: 500,
        status: "FAILED",
        message: messageCode.msgDbNotReady,
      });
    }

    const issuer = await User.findOne({ email });
    if (!issuer) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgInvalidEmail,
        details: email,
      });
    }

    // Define a mapping object for credits to service names
    const creditToServiceName = {
      1: 'issue',
      2: 'renew',
      3: 'revoke',
      4: 'reactivate'
    };

    // Get all service IDs
    const serviceIds = Object.values(creditToServiceName);

    const getCredits = await ServiceAccountQuotas.find({
      issuerId: issuer.issuerId,
      serviceId: { $in: serviceIds } // Use $in to match any of the service IDs
    });

    // Sum the limit values
    const totalLimit = getCredits.reduce((sum, credits) => sum + credits.limit, 0);
    // console.log("Total Limit:", totalLimit);
    // const issuerId = issuer.issuerId;
    // const [
    //   issuesFetch,
    //   dynamicfetch,
    //   dynamicbatchfetch,
    //   batchfetch,

    // ] = await Promise.all([
    //   Issues.find({ issuerId, issueDate: { $gte: start, $lte: end } }),
    //   DynamicIssues.find({ issuerId, issueDate: { $gte: start, $lte: end } }),
    //   DynamicBatchIssues.find({
    //     issuerId,
    //     issueDate: { $gte: start, $lte: end },
    //   }),
    //   BatchIssues.find({ issuerId, issueDate: { $gte: start, $lte: end } }),
    // ]);

    // Dynamically add user info (for "Bill To" section)
    const { name, address, city, state, country, designation, phoneNumber, organization, treansactionFee, approveDate } = issuer;
    let tableheaders = ['Item', 'Quantity', 'Price Per Unit', 'Amount']; // Dynamic headers
    let datarows = [
      ['Subscription', '1', 'Base/Free', '0$'], // Row 1
      ['TAX (IND)', '1', '18%', '0$'],  // Row 2
      // ['Product B', '2', '15$', '30$'],  // Row 3
      // ['Product D', '2', '25$', '50$'],  // Row 4
    ]; // Dynamic rows

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    const formattedTodayDate = await formatDate();
    let issuerInvoiceSerial = issuer.invoiceNumber;
    const invoiceNumber = await cerateInvoiceNumber(issuer.issuerId, issuerInvoiceSerial, formattedTodayDate);
    // console.log("The final invoice", invoiceNumber);
    if (!issuer.invoiceNumber) {
      issuer.invoiceNumber = 1;
    } else {
      issuer.invoiceNumber = issuerInvoiceSerial + 1;
    }
    await issuer.save();

    // Embed the logo image (assuming you have a PNG file)
    const logoBytes = fs.readFileSync("logo.png");
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595, 842]);

    // Add the logo
    const logoDims = logoImage.scale(0.5);
    page.drawImage(logoImage, { x: 50, y: 780, width: logoDims.width, height: logoDims.height });

    const black = rgb(0, 0, 0);
    let white = rgb(1, 1, 1)
    const gray = rgb(207 / 255, 169 / 255, 53 / 255);

    // Add the text for the header
    page.drawText('AICERTs', { x: 50, y: 750, size: 15, font: boldFont, color: black });
    page.drawText('New York', { x: 50, y: 730, size: 12, font, color: black });
    page.drawText('US', { x: 50, y: 710, size: 12, font, color: black });

    page.drawText('Bill To:', { x: 360, y: 750, size: 12, font: boldFont, color: black });
    page.drawText('Name:', { x: 360, y: 730, size: 12, font: boldFont, color: black });
    page.drawText(`${name}` || 'N/A', { x: 450, y: 730, size: 12, font, color: black });
    page.drawText('Designation:', { x: 360, y: 710, size: 12, font: boldFont, color: black });
    page.drawText(`${designation}` || 'Address Not Available', { x: 450, y: 710, size: 12, font, color: black });
    page.drawText('Organization:', { x: 360, y: 690, size: 12, font: boldFont, color: black });
    page.drawText(`${organization}`, { x: 450, y: 690, size: 12, font, color: black });

    // Add Invoice Header
    page.drawText('Invoice -', { x: 50, y: 670, size: 16, font: boldFont, color: black });
    page.drawText(`${invoiceNumber}`, { x: 125, y: 670, size: 16, font, color: black });

    // Date and Payment Mode
    page.drawText('Date:', { x: 360, y: 650, size: 12, font: boldFont, color: black });
    page.drawText(`${formattedTodayDate}`, { x: 450, y: 650, size: 12, font, color: black });
    page.drawText('Payment Mode:', { x: 360, y: 630, size: 12, font: boldFont, color: black });
    page.drawText('Online', { x: 450, y: 630, size: 12, font, color: black });
    page.drawText('Credits:', { x: 360, y: 610, size: 12, font: boldFont, color: black });
    page.drawText(`${totalLimit}`, { x: 450, y: 610, size: 12, font, color: black });
    page.drawText('Balance Due:', { x: 360, y: 590, size: 12, font: boldFont, color: black });
    page.drawText('0$', { x: 450, y: 590, size: 12, font, color: black });
    page.drawText('Billing Address:', { x: 50, y: 650, size: 12, font: boldFont, color: black });
    page.drawText(`Ph No: ${phoneNumber}`, { x: 50, y: 630, size: 12, font, color: black });
    page.drawText(address || 'Address Not Available', { x: 50, y: 610, size: 12, font, color: black });
    page.drawText(`${city}, ${state}, ${country}`, { x: 50, y: 590, size: 12, font, color: black });
    page.drawText(`From-`, { x: 50, y: 570, size: 12, font: boldFont, color: black });
    page.drawText(`${startDate}`, { x: 85, y: 570, size: 12, font, color: black });
    page.drawText(`To-`, { x: 160, y: 570, size: 12, font: boldFont, color: black });
    page.drawText(`${readableEndDate}`, { x: 180, y: 570, size: 12, font, color: black });

    // Function to draw table borders dynamically
    const drawDynamicBorders = (xPositions, yPosition, rowHeight, page) => {
      xPositions.forEach((xPos) => {
        page.drawLine({
          start: { x: xPos, y: yPosition },
          end: { x: xPos, y: yPosition - rowHeight },
          thickness: 1,
          color: black
        });
      });
    };

    // Function to draw horizontal borders (top and bottom of a row)
    const drawHorizontalBorders = (xStart, xEnd, yPosition, page) => {
      page.drawLine({ start: { x: xStart, y: yPosition }, end: { x: xEnd, y: yPosition }, thickness: 1, color: black });
    };

    // Function to calculate xPositions dynamically based on column widths
    const getColumnXPositions = (startX, colWidths) => {
      let xPositions = [startX];
      colWidths.forEach((width) => {
        xPositions.push(xPositions[xPositions.length - 1] + width);
      });
      return xPositions;
    };

    // Dynamic table drawing function
    const drawTable = (startX, startY, colWidths, headers, rows, page) => {
      const rowHeight = 20;
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0); // Total table width
      const xPositions = getColumnXPositions(startX, colWidths); // Get X positions dynamically

      // Draw header background
      page.drawRectangle({
        x: startX,
        y: startY,
        width: tableWidth,
        height: rowHeight,
        color: gray,
      });

      // Draw headers and borders
      headers.forEach((header, index) => {
        page.drawText(header, { x: xPositions[index] + 5, y: startY + 5, size: 12, font: boldFont, color: white });
      });

      // Draw horizontal borders for the header row (top and bottom)
      drawHorizontalBorders(startX, startX + tableWidth, startY, page);
      drawHorizontalBorders(startX, startX + tableWidth, startY - rowHeight, page);
      // Draw vertical borders for the header row
      drawDynamicBorders(xPositions, startY, rowHeight, page);

      // Draw each data row dynamically
      let currentY = startY - rowHeight;
      rows.forEach((row, rowIndex) => {
        const itemY = startY - (rowIndex + 1) * rowHeight;

        row.forEach((item, index) => {
          page.drawText(item, { x: xPositions[index] + 5, y: itemY + 5, size: 12, font: font, color: black });
        });

        // Draw horizontal borders for each row
        drawHorizontalBorders(startX, startX + tableWidth, itemY, page);
        drawHorizontalBorders(startX, startX + tableWidth, itemY - rowHeight, page);
        // Draw vertical borders for each row
        drawDynamicBorders(xPositions, itemY, rowHeight, page);

        currentY = itemY - rowHeight; // Update currentY after each row
      });

      // Total section
      const totalAmount = rows.reduce((sum, row) => sum + parseFloat(row[3].replace('$', '')), 0); // Calculate total from last column
      page.drawRectangle({ x: 400, y: currentY, width: 150, height: 20, color: gray });
      page.drawText('Total:', { x: 405, y: currentY + 5, size: 12, font: boldFont, color: white });
      page.drawText(`${totalAmount}$`, { x: 440, y: currentY + 5, size: 12, font: boldFont, color: white });

      // Notes and Terms
      currentY -= rowHeight + 40;
      page.drawText('Notes:', { x: 50, y: currentY, size: 12, font: boldFont, color: black });
      page.drawText('Thank you for your business.', { x: 50, y: currentY - 20, size: 12, font: font, color: black });
      currentY -= rowHeight + 40;
      page.drawText('Terms:', { x: 50, y: currentY, size: 12, font: boldFont, color: black });
      page.drawText('This invoice is auto generated at the time of delivery', { x: 50, y: currentY - 20, size: 12, font: font, color: black });

      return currentY; // Return final Y position for any additional content
    };

    // Usage example
    const startX = 50;
    const startY = 520;
    const colWidths = [100, 100, 150, 150]; // Dynamic column widths

    // Call the drawTable function
    drawTable(startX, startY, colWidths, tableheaders, datarows, page);

    // Save the PDF bytes
    const pdfBytes = await pdfDoc.save();

    const pdfStream = new Readable();
    pdfStream.push(pdfBytes);
    pdfStream.push(null); // Signal the end of the stream

    // Set the response content type and headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoiceNumber}.pdf`);

    console.log("The invoice report generated with number: ", invoiceNumber);
    // Stream the PDF to the response
    pdfStream.pipe(res);
  }
  catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({
      code: 500,
      status: "FAILED",
      message: "An error occurred while generating the report.",
    });
  }
};

/**
 * API to Fetch issues details as per the filter end user/ course name/ expiration date.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getIssuesWithFilter = async (req, res) => {
  let validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }

  var fetchedIssues = [];
  try {
    const input = req.body.input;
    const _filter = req.body.filter;
    const email = req.body.email;
    const flag = parseInt(req.body.flag);
    const filter = (_filter == 'certificationNumber') ? 'certificateNumber' : _filter;
    // Get page and limit from query parameters, with defaults
    var page = parseInt(req.query.page) || null;
    var limit = parseInt(req.query.limit) || null;
    var startIndex;
    var endIndex;
    await isDBConnected();
    const isEmailExist = await isValidIssuer(email);
    if (!isEmailExist) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidEmail, details: email });
    }
    if (input && filter) {
      var filterCriteria = `$${filter}`;
      if (flag == 1) {
        // Query 1
        var query1Promise = await Issues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $regexMatch: { input: { $toLower: filterCriteria }, regex: new RegExp(`^${input.toLowerCase()}`, 'i') } }
            ]
          },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });
        // Query 2
        var query2Promise = BatchIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $regexMatch: { input: { $toLower: filterCriteria }, regex: new RegExp(`^${input.toLowerCase()}`, 'i') } }
            ]
          },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 3
        var query3Promise = DynamicIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $regexMatch: { input: { $toLower: filterCriteria }, regex: new RegExp(`^${input.toLowerCase()}`, 'i') } }
            ]
          },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 4
        var query4Promise = DynamicBatchIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $regexMatch: { input: { $toLower: filterCriteria }, regex: new RegExp(`^${input.toLowerCase()}`, 'i') } }
            ]
          },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Await both promises
        var [query1Result, query2Result, query3Result, query4Result] = await Promise.all([query1Promise, query2Promise, query3Promise, query4Promise]);
        // Check if results are non-empty and push to finalResults
        if (query1Result && query1Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query1Result);
        }
        if (query2Result && query2Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query2Result);
        }
        if (query3Result && query3Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query3Result);
        }
        if (query4Result && query4Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query4Result);
        }
        // Extract the key match from the results
        const responseItems = fetchedIssues.map(item => item[filter]);
        // Remove duplicates using a Set
        const uniqueItems = Array.from(new Set(responseItems));
        // const uniqueItems = [...new Set(responseItems.map(item => item.toLowerCase()))];
        // Sort the values alphabetically
        fetchResult = uniqueItems.sort((a, b) => a.localeCompare(b));
        // const fetchResult = uniqueItems.map(lowerCaseItem =>
        //   responseItems.find(item => item.toLowerCase() === lowerCaseItem)
        // );
        // Map and limit to specific number of items
        // const fetchResult = uniqueItems
        //   .map(lowerCaseItem => responseItems.find(item => item.toLowerCase() === lowerCaseItem))
        //   .slice(0, searchLimit);

        if (fetchResult.length == 0) {
          return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgNoMatchFound });
        }

        return res.status(200).json({ code: 200, status: "SUCCESS", message: messageCode.msgIssueFound, details: fetchResult });

      } else {

        // Query 1
        var query1Promise = Issues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
            ]
          },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 2
        var query2Promise = BatchIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
            ]
          },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 3
        var query3Promise = DynamicIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
            ]
          },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 4
        var query4Promise = DynamicBatchIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
            ]
          },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Await both promises
        var [query1Result, query2Result, query3Result, query4Result] = await Promise.all([query1Promise, query2Promise, query3Promise, query4Promise]);
        // Check if results are non-empty and push to finalResults
        if (query1Result && query1Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query1Result);
        }
        if (query2Result && query2Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query2Result);
        }
        if (query3Result && query3Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query3Result);
        }
        if (query4Result && query4Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query4Result);
        }

        if (!page || !limit || page == 0 || limit == 0) {
          page = 1;
          limit = fetchedIssues.length;
          // Calculate the start and end indices for the slice
          startIndex = (page - 1) * limit;
          endIndex = startIndex + limit;
        } else {
          // Calculate the start and end indices for the slice
          startIndex = (page - 1) * limit;
          endIndex = startIndex + limit;
        }

        // Calculate total number of pages
        const totalItems = fetchedIssues.length;
        const totalPages = Math.ceil(totalItems / limit);

        // Slice the array to get the current page of results
        const paginatedData = fetchedIssues.slice(startIndex, endIndex);

        const paginationDetails = {
          total: totalItems,
          page: page,
          limit: limit,
          totalPages: totalPages
        }

        if (fetchedIssues.length == 0) {
          return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgNoMatchFound });
        }
        // Check if the requested page is beyond the total pages
        if (page > totalPages && totalPages > 0) {
          return res.status(404).json({
            code: 404,
            status: "SUCCESS",
            message: messageCode.msgPageNotFound,
            data: [],
            pagination: paginationDetails
          });
        }

        const matchPages = {
          data: paginatedData,
          ...paginationDetails
        }

        return res.status(200).json({ code: 200, status: "SUCCESS", message: messageCode.msgIssueFound, details: matchPages });
      }
    } else {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidInput, detail: input });
    }

  } catch (error) {
    return res.status(500).json({ code: 500, status: "FAILED", message: messageCode.msgInternalError });
  }
};

/**
 * API to Fetch issues details (for renew/revoke/reactivation) as per the filter end user/ course name/ expiration date.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const adminSearchWithFilter = async (req, res) => {
  let validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }

  var fetchedIssues = [];

  try {
    const input = req.body.input;
    const _filter = req.body.filter;
    const email = req.body.email;
    const flag = parseInt(req.body.flag);
    const filter = (_filter == 'certificationNumber') ? 'certificateNumber' : _filter;
    const status = parseInt(req.body.status);
    // Get page and limit from query parameters, with defaults
    var page = parseInt(req.query.page) || null;
    var limit = parseInt(req.query.limit) || null;
    var startIndex;
    var endIndex;
    var certStatusFilter;
    var expirationDateFilter = null;
    await isDBConnected();
    const isEmailExist = await isValidIssuer(email);
    if (!isEmailExist) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidEmail, details: email });
    }

    if (!status) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidStatusValue });
    }

    if (status == 1) {
      certStatusFilter = [1, 2, 4];
      expirationDateFilter = "1";
    } else if (status == 2) {
      certStatusFilter = [3];
    } else if (status == 3) {
      certStatusFilter = [1, 2, 4];
    }

    if (input && filter) {
      var filterCriteria = `$${filter}`;
      if (flag == 1) {
        // Query 1
        var query1Promise = Issues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $regexMatch: { input: { $toLower: filterCriteria }, regex: new RegExp(`^${input.toLowerCase()}`, 'i') } }
            ]
          },
          certificateStatus: { $in: certStatusFilter },
          expirationDate: { $ne: expirationDateFilter },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 2
        var query2Promise = BatchIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $regexMatch: { input: { $toLower: filterCriteria }, regex: new RegExp(`^${input.toLowerCase()}`, 'i') } }
            ]
          },
          certificateStatus: { $in: certStatusFilter },
          expirationDate: { $ne: expirationDateFilter },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 3
        var query3Promise = DynamicIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $regexMatch: { input: { $toLower: filterCriteria }, regex: new RegExp(`^${input.toLowerCase()}`, 'i') } }
            ]
          },
          certificateStatus: { $in: certStatusFilter },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 4
        var query4Promise = DynamicBatchIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $regexMatch: { input: { $toLower: filterCriteria }, regex: new RegExp(`^${input.toLowerCase()}`, 'i') } }
            ]
          },
          certificateStatus: { $in: certStatusFilter },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Await both promises
        var [query1Result, query2Result, query3Result, query4Result] = await Promise.all([query1Promise, query2Promise, query3Promise, query4Promise]);
        // Check if results are non-empty and push to finalResults
        if (query1Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query1Result);
        }
        if (query2Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query2Result);
        }
        if (query3Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query3Result);
        }
        if (query4Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query4Result);
        }

        // Extract the key match from the results
        const responseItems = fetchedIssues.map(item => item[filter]);
        // Remove duplicates using a Set
        const uniqueItems = Array.from(new Set(responseItems));
        // Sort the values alphabetically
        fetchResult = uniqueItems.sort((a, b) => a.localeCompare(b));

        if (fetchResult.length == 0) {
          return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgNoMatchFound });
        }

        return res.status(200).json({ code: 200, status: "SUCCESS", message: messageCode.msgIssueFound, details: fetchResult });

      } else {

        // Query 1
        var query1Promise = Issues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
            ]
          },
          certificateStatus: { $in: certStatusFilter },
          expirationDate: { $ne: expirationDateFilter },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 2
        var query2Promise = BatchIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
            ]
          },
          certificateStatus: { $in: certStatusFilter },
          expirationDate: { $ne: expirationDateFilter },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Query 3
        var query3Promise = DynamicIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
            ]
          },
          certificateStatus: { $in: certStatusFilter },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });


        // Query 4
        var query4Promise = DynamicBatchIssues.find({
          issuerId: isEmailExist.issuerId,
          $expr: {
            $and: [
              { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
            ]
          },
          certificateStatus: { $in: certStatusFilter },
          url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
        });

        // Await both promises
        var [query1Result, query2Result, query3Result, query4Result] = await Promise.all([query1Promise, query2Promise, query3Promise, query4Promise]);
        // Check if results are non-empty and push to finalResults
        if (query1Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query1Result);
        }
        if (query2Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query2Result);
        }
        if (query3Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query3Result);
        }
        if (query4Result.length > 0) {
          fetchedIssues = fetchedIssues.concat(query4Result);
        }

        if (!page || !limit || page == 0 || limit == 0) {
          page = 1;
          limit = fetchedIssues.length;
          // Calculate the start and end indices for the slice
          startIndex = (page - 1) * limit;
          endIndex = startIndex + limit;
        } else {
          // Calculate the start and end indices for the slice
          startIndex = (page - 1) * limit;
          endIndex = startIndex + limit;
        }

        // Calculate total number of pages
        const totalItems = fetchedIssues.length;
        const totalPages = Math.ceil(totalItems / limit);

        // Slice the array to get the current page of results
        const paginatedData = fetchedIssues.slice(startIndex, endIndex);

        const paginationDetails = {
          total: totalItems,
          page: page,
          limit: limit,
          totalPages: totalPages
        }

        if (fetchedIssues.length == 0) {
          return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgNoMatchFound });
        }
        // Check if the requested page is beyond the total pages
        if (page > totalPages && totalPages > 0) {
          return res.status(404).json({
            code: 404,
            status: "SUCCESS",
            message: messageCode.msgPageNotFound,
            data: [],
            pagination: paginationDetails
          });
        }

        const matchPages = {
          data: paginatedData,
          ...paginationDetails
        }

        return res.status(200).json({ code: 200, status: "SUCCESS", message: messageCode.msgIssueFound, details: matchPages });
      }
    } else {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidInput, detail: input });
    }

  } catch (error) {
    return res.status(500).json({ code: 500, status: "FAILED", message: messageCode.msgInternalError });
  }

};

/**
 * API to search issues based on filters.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getIssuersWithFilter = async (req, res) => {
  let validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  try {
    const input = req.body.input;
    const filter = req.body.filter;
    const flag = parseInt(req.body.flag);
    if (!filter || !input || !flag == 1 || !flag == 2) {
      return res.status(400).send({ status: "FAILED", message: messageCode.msgEnterInvalid });
    }
    var fetchResult;
    if (flag == 1) {
      const query = {};
      const projection = {};
      query[filter] = { $regex: `^${input}`, $options: 'i' };
      // Construct the projection object dynamically
      projection[filter] = 1; // Include the field specified by `key`
      projection['_id'] = 0; // Exclude the `_id` field
      fetchResponse = await User.find(query, projection);
      // Extract the key match from the results
      const responseItems = fetchResponse.map(item => item[filter]);
      // Remove duplicates using a Set
      // const uniqueItems = Array.from(new Set(responseItems));
      const uniqueItems = [...new Set(responseItems.map(item => item.toLowerCase()))];
      // Sort the values alphabetically
      // fetchResult = uniqueItems.sort((a, b) => a.localeCompare(b));
      fetchResult = uniqueItems.map(lowerCaseItem =>
        responseItems.find(item => item.toLowerCase() === lowerCaseItem)
      );
    } else {
      let filterCriteria = `$${filter}`;
      fetchResult = await User.find({
        $expr: {
          $and: [
            { $eq: [{ $toLower: filterCriteria }, input.toLowerCase()] }
          ]
        }
      }).select(['-password']);
    }

    if (fetchResult.length == 0) {
      return res.status(400).json({ status: "FAILED", message: messageCode.msgNoMatchFound });
    }
    return res.status(200).json({ status: "SUCCESS", message: messageCode.msgAllIssuersFetched, details: fetchResult });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: messageCode.msgInternalError });
  }
};

/**
 * API to fetch Graph details with Single & Batch issue in the Year.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const fetchGraphDetails = async (req, res) => {
  const _year = req.params.year; // Get the value from the URL parameter
  const email = req.params.email; // Get the email from the URL parameter

  var year = parseInt(_year);
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
    return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgDbError });
  }

  // Check if user with provided email exists
  const issuerExist = await isValidIssuer(email);

  if (!issuerExist) {
    return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgUserEmailNotFound });
  }

  try {
    // var fetchAnnualSingleIssues = await IssueStatus.find({
    //   email: issuerExist.email,
    //   certStatus: 1,
    //   batchId: null
    // }).lean();

    // var fetchAnnualBatchIssues = await IssueStatus.find({
    //   email: issuerExist.email,
    //   certStatus: 1,
    //   batchId: { $ne: null }
    // }).lean();

    // Fetch all certificates with the specified email and certStatus in one call
    const certificates = await IssueStatus.find(
      { email: issuerExist.email, certStatus: 1 },
      { lastUpdate: 1, certStatus: 1, /* other necessary fields */ }
    ).lean();

    // Organize certificates based on their certStatus
    const result = {
      single: certificates.filter(cert => cert.certStatus === 1 && cert.batchId === null),
      batch: certificates.filter(cert => cert.certStatus === 1 && cert.batchId !== null)
      // Add any other statuses as needed
    };

    var fetchAnnualSingleIssues = result.single;
    var fetchAnnualBatchIssues = result.batch;

    var getSingleIssueDetailsMonthCount = await getAggregatedCertsDetails(fetchAnnualSingleIssues, year);
    var getBatchIssueDetailsMonthCount = await getAggregatedCertsDetails(fetchAnnualBatchIssues, year);

    const mergedDetails = getSingleIssueDetailsMonthCount.map((singleItem, index) => ({
      month: singleItem.month,
      count: [singleItem.count, getBatchIssueDetailsMonthCount[index].count]
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

const getAggregatedCertsDetails = async (data, year) => {

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
  const monthCounts = {};
  dataYear.forEach(entry => {
    const month = moment(entry.lastUpdate).month() + 1; // Adding 1 because moment.js months are 0-indexed
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  // Create array with counts for all months in the specified year
  const monthCountsArray = [];
  for (let i = 1; i <= 12; i++) {
    monthCountsArray.push({ month: i, count: monthCounts[i] || 0 });
  }

  return monthCountsArray;

};

/**
 * API to fetch Graph details with Query-parameter.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const fetchGraphStatusDetails = async (req, res) => {
  const _value = req.params.value; // Get the value from the URL parameter
  const email = req.params.email; // Get the email from the URL parameter

  // Get today's date
  var today = new Date();
  var value = parseInt(_value);
  // Check if value is between 1 and 12 and equal to 2024
  if ((value !== null && value !== '') && // Check if value is not null or empty
    ((value < 2000 || value > 2199) && (value < 1 || value > 12))) {
    // Send the fetched graph data as a response
    return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidGraphInput, details: value });
  }

  // Check mongoose connection
  const dbStatus = await isDBConnected();
  const dbStatusMessage = (dbStatus == true) ? "Database connection is Ready" : "Database connection is Not Ready";
  console.log(dbStatusMessage);

  if (dbStatus == false) {
    return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgDbError });
  }

  // Check if user with provided email exists
  const issuerExist = await isValidIssuer(email);

  if (!issuerExist) {
    return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgUserEmailNotFound });
  }

  try {

    // Fetch all certificates with the specified email and certStatus in one call
    const certificates = await IssueStatus.find(
      { email: issuerExist.email, certStatus: { $in: [1, 2, 3, 4] } },
      { lastUpdate: 1, certStatus: 1, /* other necessary fields */ }
    ).lean();

    // Organize certificates based on their certStatus
    const result = {
      issued: certificates.filter(cert => cert.certStatus === 1),
      renewed: certificates.filter(cert => cert.certStatus === 2),
      revoked: certificates.filter(cert => cert.certStatus === 3),
      reactivated: certificates.filter(cert => cert.certStatus === 4),
    };

    var fetchAllCertificateIssues = result.issued;
    var fetchAllCertificateRenewes = result.renewed;
    var fetchAllCertificateRevoked = result.revoked;
    var fetchAllCertificateReactivated = result.reactivated;
    // console.log("All status responses", fetchAllCertificateIssues.length, fetchAllCertificateRenewes.length, fetchAllCertificateRevoked.length, fetchAllCertificateReactivated.length);

    if (value > 2000 && value < 2199) {

      var getIssueDetailsMonthCount = await getAggregatedCertsDetails(fetchAllCertificateIssues, value);
      var getRenewDetailsMonthCount = await getAggregatedCertsDetails(fetchAllCertificateRenewes, value);
      var getRevokedDetailsMonthCount = await getAggregatedCertsDetails(fetchAllCertificateRevoked, value);
      var getReactivatedDetailsMonthCount = await getAggregatedCertsDetails(fetchAllCertificateReactivated, value);

      const mergedDetails = getIssueDetailsMonthCount.map((singleItem, index) => ({
        month: singleItem.month,
        count: [singleItem.count, getRenewDetailsMonthCount[index].count, getRevokedDetailsMonthCount[index].count, getReactivatedDetailsMonthCount[index].count]
      }));

      var responseData = mergedDetails.length > 1 ? mergedDetails : 0;

      // Send the fetched graph data as a response
      res.json({
        code: 200,
        status: "SUCCESS",
        message: messageCode.msgGraphDataFetched,
        data: responseData,
      });
      return;
    } else if (value >= 1 && value <= 12) {

      var getIssueDetailsDaysCount = await getMonthAggregatedCertsDetails(fetchAllCertificateIssues, value, today.getFullYear());
      var getRenewDetailsDaysCount = await getMonthAggregatedCertsDetails(fetchAllCertificateRenewes, value, today.getFullYear());
      var getRevokedDetailsDaysCount = await getMonthAggregatedCertsDetails(fetchAllCertificateRevoked, value, today.getFullYear());
      var getReactivatedDetailsDaysCount = await getMonthAggregatedCertsDetails(fetchAllCertificateReactivated, value, today.getFullYear());

      const mergedDaysDetails = getIssueDetailsDaysCount.map((singleItem, index) => ({
        day: singleItem.day,
        count: [singleItem.count, getRenewDetailsDaysCount[index].count, getRevokedDetailsDaysCount[index].count, getReactivatedDetailsDaysCount[index].count]
      }));

      var responseData = mergedDaysDetails.length > 1 ? mergedDaysDetails : 0;

      // Send the fetched graph data as a response
      res.json({
        code: 200,
        status: "SUCCESS",
        message: messageCode.msgGraphDataFetched,
        data: responseData,
      });

    } else {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgInvalidGraphInput, details: value });
    }
  } catch (error) {
    return res.status(500).json({ code: 400, status: "FAILED", message: messageCode.msgInternalError, details: error });
  }
};

const getMonthAggregatedCertsDetails = async (data, month, year) => {

  // Function to extract month and year from lastUpdate field
  const getMonthYear = (entry) => {
    const date = moment(entry.lastUpdate);
    const year = date.year();
    return year;
  };

  // Function to get formatted month with leading zero if needed
  const getFormattedMonth = (month) => {
    return month < 10 ? "0" + month : month.toString();
  };

  // Filter data for the specified month and year
  const dataMonthYear = data.filter(entry => {
    const entryYear = getMonthYear(entry);
    const entryMonth = moment(entry.lastUpdate).month() + 1;
    return entryYear === year && entryMonth === month;
  });

  // Count occurrences of each day in the month
  const daysCounts = {};
  dataMonthYear.forEach(entry => {
    const day = moment(entry.lastUpdate).date();
    daysCounts[day] = (daysCounts[day] || 0) + 1;
  });

  // Create array with counts for all days in the specified month and year
  const daysCountsArray = [];
  const daysInMonth = moment(`${year}-${getFormattedMonth(month)}`, "YYYY-MM").daysInMonth();
  for (let i = 1; i <= daysInMonth; i++) {
    daysCountsArray.push({ day: i, count: daysCounts[i] || 0 });
  }
  return daysCountsArray;
};

/**
 * API to fetch details with Query-parameter.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const fetchIssuesLogDetails = async (req, res) => {
  let validResult = validationResult(req);
  if (!validResult.isEmpty()) {
    return res.status(422).json({ code: 422, status: "FAILED", message: messageCode.msgEnterInvalid, details: validResult.array() });
  }
  try {
    // Extracting required data from the request body
    const email = req.body.email;
    const queryCode = req.body.queryCode;
    const queryParams = req.query.queryParams;

    // Get today's date
    var today = new Date();
    // Formatting the parsed date into ISO 8601 format with timezone
    var formattedDate = today.toISOString();
    var queryResponse;

    // Get today's date
    const getTodayDate = async () => {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero if month is less than 10
      const day = String(today.getDate()).padStart(2, '0'); // Add leading zero if day is less than 10
      const year = today.getFullYear();
      return `${month}/${day}/${year}`;
    };
    const todayDate = await getTodayDate();

    // console.log("date", todayDate);

    // Check mongoose connection
    const dbStatus = await isDBConnected();
    const dbStatusMessage = (dbStatus == true) ? "Database connection is Ready" : "Database connection is Not Ready";
    console.log(dbStatusMessage);

    // Check if user with provided email exists
    const issuerExist = await isValidIssuer(email);

    if (!issuerExist) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgUserNotFound });
    }

    if (queryCode || queryParams) {
      var inputQuery = parseInt(queryCode || queryParams);
      switch (inputQuery) {
        case 1:  // Get the all issued certs count
          var issueCount = issuerExist.certificatesIssued;

          var renewCount = issuerExist.certificatesRenewed;

          var revokedCount = await IssueStatus.find({
            email: req.body.email,
            certStatus: 3
          });
          var reactivatedCount = await IssueStatus.find({
            email: req.body.email,
            certStatus: 4
          });
          queryResponse = { issued: issueCount, renewed: renewCount, revoked: revokedCount.length, reactivated: reactivatedCount.length };
          break;
        case 2:
          queryResponse = await IssueStatus.find({
            email: req.body.email,
            $and: [
              { certStatus: { $eq: [1, 2] } },
              { expirationDate: { $gt: formattedDate } }]
          });
          // Sort the data based on the 'lastUpdate' date in descending order
          // queryResponse.sort((b, a) => new Date(b.expirationDate) - new Date(a.expirationDate));
          break;
        case 3:
          queryResponse = await IssueStatus.find({
            email: req.body.email,
            $and: [{ certStatus: { $eq: [1, 2] }, expirationDate: { $ne: "1" } }]
          });
          // Sort the data based on the 'lastUpdate' date in descending order
          // queryResponse.sort((b, a) => new Date(b.expirationDate) - new Date(a.expirationDate));
          break;
        case 4:
          queryResponse = await IssueStatus.find({
            email: req.body.email,
            $and: [{ certStatus: { $eq: 3 }, expirationDate: { $gt: formattedDate } }]
          });
          // Sort the data based on the 'lastUpdate' date in descending order
          queryResponse.sort((b, a) => new Date(b.expirationDate) - new Date(a.expirationDate));
          break;
        case 5:
          queryResponse = await IssueStatus.find({
            email: req.body.email,
            $and: [{ expirationDate: { $lt: formattedDate } }]
          });
          // Sort the data based on the 'lastUpdate' date in descending order
          queryResponse.sort((b, a) => new Date(b.expirationDate) - new Date(a.expirationDate));
          break;
        case 6:
          var filteredResponse6 = [];

          const commonFilter = {
            issuerId: issuerExist.issuerId,
            certificateStatus: { $in: [1, 2, 4] },
            url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket }
          };

          // Fetch all issues across different models
          const [issues, batchIssues, dynamicIssues, dynamicBatchIssues] = await Promise.all([
            Issues.find(commonFilter, { issueDate: 1, certificateNumber: 1, expirationDate: 1, name: 1 }).lean(),
            BatchIssues.find(commonFilter, { issueDate: 1, certificateNumber: 1, expirationDate: 1, name: 1 }).lean(),
            DynamicIssues.find(commonFilter, { issueDate: 1, certificateNumber: 1, name: 1 }).lean(),
            DynamicBatchIssues.find(commonFilter, { issueDate: 1, certificateNumber: 1, name: 1 }).lean()
          ]);

          // Organize issues based on their source
          const result = {
            issues,
            batchIssues,
            dynamicIssues,
            dynamicBatchIssues,
          };

          var queryResponse1 = result.issues;
          var queryResponse2 = result.batchIssues;
          var queryResponse3 = result.dynamicIssues;
          var queryResponse4 = result.dynamicBatchIssues;

          // Merge the results into a single array
          var _queryResponse = [...queryResponse1, ...queryResponse2, ...queryResponse3, ...queryResponse4];
          // Sort the data based on the 'issueDate' date in descending order
          _queryResponse.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

          for (var item6 of _queryResponse) {
            var certificateNumber = item6.certificateNumber;
            const issueStatus6 = await IssueStatus.findOne({ certificateNumber });
            if (issueStatus6) {
              // Push the matching issue status into filteredResponse
              filteredResponse6.push(item6);
            }
            // If filteredResponse reaches 30 matches, break out of the loop
            if (filteredResponse6.length >= 30) {
              break;
            }
          }
          // Take only the first 30 records
          // var queryResponse = _queryResponse.slice(0, Math.min(_queryResponse.length, 30));
          queryResponse = filteredResponse6;
          break;
        case 7://To fetch Revoked certifications and count

          const commonFilterRevoke = {
            issuerId: issuerExist.issuerId,
            certificateStatus: { $in: [3] },
            url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket }
          };

          // Fetch all issues across different models
          const [issuesRevoke, batchIssuesRevoke, dynamicIssuesRevoke, dynamicBatchIssuesRevoke] = await Promise.all([
            Issues.find(commonFilterRevoke, { issueDate: 1, certificateNumber: 1, expirationDate: 1, name: 1 }).lean(),
            BatchIssues.find(commonFilterRevoke, { issueDate: 1, certificateNumber: 1, expirationDate: 1, name: 1 }).lean(),
            DynamicIssues.find(commonFilterRevoke, { issueDate: 1, certificateNumber: 1, name: 1 }).lean(),
            DynamicBatchIssues.find(commonFilterRevoke, { issueDate: 1, certificateNumber: 1, name: 1 }).lean()
          ]);

          // Organize issues based on their source
          const resultRevoke = {
            issuesRevoke,
            batchIssuesRevoke,
            dynamicIssuesRevoke,
            dynamicBatchIssuesRevoke,
          };

          var queryResponse1 = resultRevoke.issuesRevoke;
          var queryResponse2 = resultRevoke.dynamicIssuesRevoke;
          var queryResponse3 = resultRevoke.dynamicIssuesRevoke;
          var queryResponse4 = resultRevoke.dynamicBatchIssuesRevoke;

          // Merge the results into a single array
          var _queryResponse = [...queryResponse1, ...queryResponse2, ...queryResponse3, ...queryResponse4];
          // Sort the data based on the 'issueDate' date in descending order
          _queryResponse.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

          // Take only the first 30 records
          queryResponse = _queryResponse.slice(0, Math.min(_queryResponse.length, 30));
          break;
        case 8:
          var filteredResponse8 = [];
          
          const commonFilterReactivate = {
            issuerId: issuerExist.issuerId,
            certificateStatus: { $in: [1, 2, 4] },
            expirationDate: { $ne: "1" },
            url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket }
          };

          // Fetch all issues across different models
          const [issuesReactivate, batchIssuesReactivate] = await Promise.all([
            Issues.find(commonFilterReactivate, { issueDate: 1, certificateNumber: 1, expirationDate: 1, name: 1 }).lean(),
            BatchIssues.find(commonFilterReactivate, { issueDate: 1, certificateNumber: 1, expirationDate: 1, name: 1 }).lean(),
           ]);

           // Organize issues based on their source
          const resultReactivate = {
            issuesReactivate,
            batchIssuesReactivate
          };

          var queryResponse1 = resultReactivate.issuesReactivate;
          var queryResponse2 = resultReactivate.batchIssuesReactivate;

          // Merge the results into a single array
          var queryResponse = [...queryResponse1, ...queryResponse2];

          // Filter the data to show only expiration dates on or after today
          queryResponse = queryResponse.filter(item => new Date(item.expirationDate) >= new Date(todayDate));

          // Sort the data based on the 'expirationDate' date in descending order
          queryResponse.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

          // Sort the data based on the 'issueDate' date in descending order
          // queryResponse.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

          for (let item8 of queryResponse) {
            let certificateNumber = item8.certificateNumber;
            const issueStatus8 = await IssueStatus.findOne({ certificateNumber });
            if (issueStatus8) {
              // Push the matching issue status into filteredResponse
              filteredResponse8.push(item8);
            }
            // If filteredResponse reaches 30 matches, break out of the loop
            if (filteredResponse8.length >= 30) {
              break;
            }
          }
          // Take only the first 30 records
          // var queryResponse = queryResponse.slice(0, Math.min(queryResponse.length, 30));
          queryResponse = filteredResponse8;
          break;
        case 9:
          var queryResponse = await Issues.find({
            issuerId: issuerExist.issuerId,
            $and: [{ certificateStatus: { $eq: 4 } }]
          });
          break;
        default:
          queryResponse = 0;
          var totalResponses = 0;
          var responseMessage = messageCode.msgNoMatchFound;
      };
    } else {
      queryResponse = 0;
      var totalResponses = 0;
      var responseMessage = messageCode.msgNoMatchFound;
    }

    var totalResponses = queryResponse.length || Object.keys(queryResponse).length;
    var responseStatus = totalResponses > 0 ? 'SUCCESS' : 'FAILED';
    var responseCode = totalResponses > 0 ? 200 : 400;
    var responseMessage = totalResponses > 0 ? messageCode.msgAllQueryFetched : messageCode.msgNoMatchFound;

    // Respond with success and all user details
    res.json({
      code: responseCode,
      status: responseStatus,
      data: queryResponse,
      responses: totalResponses,
      message: responseMessage
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
 * API to fetch single issues with Query-parameter.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getSingleCertificates = async (req, res) => {
  try {
    const { issuerId, type } = req.body;

    // Validate request body
    if (!issuerId || (type !== 1 && type !== 2)) {
      return res.status(400).json({ code: 400, status: "FAILED", message: "issuerId and valid type (1 or 2 or 3) are required" });
    }

    // Convert type to integer if it is a string
    const typeInt = parseInt(type, 10);

    // Determine the type field value based on the provided type
    let typeField;
    if (typeInt == 1) {
      typeField = ['withpdf', 'dynamic'];
    } else if (typeInt == 2) {
      typeField = ['withoutpdf'];
    } else {
      return res.status(400).json({ code: 400, status: "FAILED", message: "Invalid type provided" });
    }
    // Fetch certificates based on issuerId and type
    const certificatesSimple = await Issues.find({
      issuerId: issuerId,
      type: { $in: typeField },
      url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
    });

    const certificatesDynamic = await DynamicIssues.find({
      issuerId: issuerId,
      type: { $in: typeField },
      url: { $exists: true, $ne: null, $ne: "", $regex: cloudBucket } // Filter to include documents where `url` exists
    });

    const certificates = [...certificatesSimple, ...certificatesDynamic];

    // Function to sort data by issueDate
    certificates.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

    // Respond with success and the certificates
    res.json({
      code: 200,
      status: 'SUCCESS',
      data: certificates,
      message: 'Certificates fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);

    // Respond with failure message
    res.status(500).json({
      code: 500,
      status: 'FAILED',
      message: 'An error occurred while fetching the certificates',
      details: error.message
    });
  }
};

/**
 * API to fetch batch issues dates with Query-parameter.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getBatchCertificateDates = async (req, res) => {
  try {
    const { issuerId } = req.body;

    // Validate issuerId
    if (!issuerId) {
      return res.status(400).json({ code: 400, status: "FAILED", message: "issuerId is required" });
    }

    // Fetch all batch certificates for the given issuerId
    const batchCertificatesOne = await BatchIssues.find({ issuerId }).sort({ issueDate: 1 });
    const batchCertificatesTwo = await DynamicBatchIssues.find({ issuerId }).sort({ issueDate: 1 });

    const batchCertificates = [...batchCertificatesOne, ...batchCertificatesTwo];


    // Create a map to store the first certificate's issueDate for each batchId
    const batchDateMap = new Map();

    // Iterate through the certificates and store the first occurrence's issueDate for each batchId
    batchCertificates.forEach(cert => {
      if (!batchDateMap.has(cert.batchId)) {
        batchDateMap.set(cert.batchId, { issueDate: cert.issueDate, issuerId: cert.issuerId });
      }
    });

    // Convert the map to an array of objects with batchId, issueDate, and issuerId
    const uniqueBatchDates = Array.from(batchDateMap, ([batchId, value]) => ({
      batchId,
      issueDate: value.issueDate,
      issuerId: value.issuerId
    }));

    // Function to sort data by issueDate
    uniqueBatchDates.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

    // Respond with success and the unique batch dates
    res.json({
      code: 200,
      status: 'SUCCESS',
      data: uniqueBatchDates,
      message: 'Unique batch dates fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching unique batch dates:', error);

    // Respond with failure message
    res.status(500).json({
      code: 500,
      status: 'FAILED',
      message: 'An error occurred while fetching the unique batch dates',
      details: error.message
    });
  }
};

/**
 * API to fetch batch issues with Query-parameter.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getBatchCertificates = async (req, res) => {
  try {
    const { batchId, issuerId } = req.body;

    // Validate input
    if (!batchId || !issuerId) {
      return res.status(400).json({ code: 400, status: "FAILED", message: "batchId and issuerId are required" });
    }

    // Fetch all certificates for the given batchId and issuerId
    var certificates = await BatchIssues.find({ batchId, issuerId });
    if (!certificates || certificates.length < 1) {
      certificates = await DynamicBatchIssues.find({ batchId, issuerId });
    }

    // Respond with success and the certificates
    res.json({
      code: 200,
      status: 'SUCCESS',
      data: certificates,
      message: 'Certificates fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);

    // Respond with failure message
    res.status(500).json({
      code: 500,
      status: 'FAILED',
      message: 'An error occurred while fetching the certificates',
      details: error.message
    });
  }
};

module.exports = {
  // Function to get all issuers (Active, Inavtive, Pending)
  getAllIssuers,

  // Function to get the issuer details on email as input
  getIssuerByEmail,

  // Function to fetch Custom server details
  fetchServerDetails,

  // Function to upload server details
  uploadServerDetails,

  // Function to delete existing server details
  deleteServerDetails,

  // Function to get admin graph (issues & issuers count month wise) details
  getAdminGraphDetails,

  // Function to update custom template details
  updateCertificateTemplate,

  // Function to add custom certificate template details
  addCertificateTemplate,

  // Function to get custom certificate template details
  getCertificateTemplates,

  deleteCertificateTemplateById,

  deleteCertificateTemplates,
  // Function to generate Issuer report in excel format
  generateExcelReport,

  // Function to generate Issuer invoice in pdf format
  generateInvoiceDocument,

  // Function to get credit service limits by issuer email
  getServiceLimitsByEmail,

  // Function to get detailed verification responses (course wise)
  getVerificationDetailsByCourse,

  // Function to fetch issues/Gallery certs based on the flag based filter (certificationId, name, course, grantDate, expirationDate)
  getIssuesWithFilter,

  // Function to fetch issues details (for renew/revoke/reactivation) as per the filter end user/ course name/ expiration date.
  adminSearchWithFilter,

  // Function to fetch only issuers based on the filter (name/email/organization)
  getIssuersWithFilter,

  // Function to fetch details for Graph from Issuer log
  fetchGraphDetails,

  // Function to fetch Core features count based response on monthly/yearly for the Graph
  fetchGraphStatusDetails,

  // Function to fetch details from Issuers log
  fetchIssuesLogDetails,

  // Function to get single issued certifications from the DB (with / without pdf)
  getSingleCertificates,

  // Function to get single issued certifications from the DB (with / without pdf)
  getSingleCertificates,

  // Function to get batch issued certifications from the DB
  getBatchCertificates,

  // Function to get batch issued certifications from the DB based on Dates
  getBatchCertificateDates,


};
