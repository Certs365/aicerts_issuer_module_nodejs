// Load environment variables from .env file
require('dotenv').config();

const moment = require('moment');

// Import MongoDB models
const { Admin, User, Issues, BatchIssues, IssueStatus, CrediantialTemplate, ServiceAccountQuotas, DynamicIssues, DynamicBatchIssues, ServerDetails } = require("../config/schema");


const _getAggregatedCertsDetails = async (data, year, type) => {
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

const addHeading = async (text, worksheet) => {
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
};

// Create a bar chart image using QuickChart API
const generateChartImage = async (data) => {
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


module.exports = {
    // Function to get aggregated details month wise
    _getAggregatedCertsDetails,

    addHeading,

    generateChartImage,
};
