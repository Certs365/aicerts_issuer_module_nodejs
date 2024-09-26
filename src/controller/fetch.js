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
} = require('../models/tasks'); // Importing functions from the '../model/tasks' module

const {
  getAggregatedCertsDetails,
} = require('../utils/customModules');

// Import MongoDB models
const { Admin, User, Issues, BatchIssues, IssueStatus, CrediantialTemplate, ServiceAccountQuotas, DynamicIssues, DynamicBatchIssues, ServerDetails } = require("../config/schema");

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

    const issuer = await User.findOne({ email : email }).select('-password');

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

    const issuerExist = await User.findOne({ email : email });
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
    var fetchAnnualIssues = await IssueStatus.find({
      certStatus: { $eq: 1 }
    }).lean();

    var fetchAnnualIssuers = await User.find({
      approveDate: { $ne: null }
    }).lean();

    if (!fetchAnnualIssues && !fetchAnnualIssuers) {
      return res.status(400).json({ code: 400, status: "FAILED", message: messageCode.msgDbNotReady });
    }

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
    const { startDate, endDate, email, value } = req.body;
    if (!startDate || !endDate || !email || !value) {
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

    if (value == 1) {
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
    } else if (value == 2) {

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

        worksheet.mergeCells(`A${row.number}:G${row.number}`);
        row.font = { bold: true, size: 15 };
        return row;
      }
      const workbook = new ExcelJS.Workbook();

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

      const worksheet2 = workbook.addWorksheet("Certs Data");

      addHeading("Certs Data", worksheet2)
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
    } else {
      res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgEnterInvalid,
      });
    }
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
    const { email, input } = req.body
    if (!email) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgEnterInvalid,
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

    const issuer = await User.findOne({ email });
    if (!issuer) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: messageCode.msgInvalidEmail,
        details: email,
      });
    }

    // Dynamically add user info (for "Bill To" section)
    const { name, address, city, state, country, designation, phoneNumber, organization, treansactionFee, approveDate } = issuer;
    let tableheaders = ['Item', 'Quantity', 'Price Per Unit', 'Amount']; // Dynamic headers
    let datarows = [
      ['Subscription', '0', '0$', '0$'], // Row 1
      ['Product A', '5', '10$', '50$'],  // Row 2
      ['Product B', '2', '15$', '30$'],  // Row 3
    ]; // Dynamic rows

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    const formattedTodayDate = await formatDate();
    const invoiceNumber = await cerateInvoiceNumber(issuer.issuerId, issuer.invoiceNumber, formattedTodayDate);

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
    page.drawText('Invoice -', { x: 50, y: 670, size: 18, font: boldFont, color: black });
    page.drawText('INV-001', { x: 125, y: 670, size: 18, font, color: black });

    // Date and Payment Mode
    page.drawText('Date:', { x: 360, y: 650, size: 12, font: boldFont, color: black });
    page.drawText(`${formattedTodayDate}`, { x: 450, y: 650, size: 12, font, color: black });
    page.drawText('Payment Mode:', { x: 360, y: 630, size: 12, font: boldFont, color: black });
    page.drawText('Online', { x: 450, y: 630, size: 12, font, color: black });
    page.drawText('Balance Due:', { x: 360, y: 610, size: 12, font: boldFont, color: black });
    page.drawText('0$', { x: 450, y: 610, size: 12, font, color: black });
    page.drawText('Billing Address:', { x: 50, y: 650, size: 12, font: boldFont, color: black });
    page.drawText(`Ph No: ${phoneNumber}`, { x: 50, y: 630, size: 12, font, color: black });
    page.drawText(address || 'Address Not Available', { x: 50, y: 610, size: 12, font, color: black });
    page.drawText(`${city}, ${state}, ${country}`, { x: 50, y: 590, size: 12, font, color: black });

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
    const startY = 550;
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
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${Date.now()}.pdf`);

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


module.exports = {
  // Function to get all issuers (Active, Inavtive, Pending)
  getAllIssuers,

  getIssuerByEmail,

  fetchServerDetails,

  uploadServerDetails,

  getAdminGraphDetails,

  updateCertificateTemplate,

  addCertificateTemplate,

  getCertificateTemplates,

  generateExcelReport,

  generateInvoiceDocument,

  getServiceLimitsByEmail
};
