// Load environment variables from .env file
require('dotenv').config();

const moment = require('moment');

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



module.exports = {
    // Function to get aggregated details month wise
    getAggregatedCertsDetails,

};
