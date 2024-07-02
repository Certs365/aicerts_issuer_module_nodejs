require('dotenv').config();
const mongoose = require("mongoose");
const maxRetries = 3;
var retryCount;

function connectWithRetry() {
    try {
        mongoose.connect(process.env.MONGODB_URI)
            .then(() => {
                console.log("DB Connected");
            })
            .catch((err) => {
                console.log("DB Connection Failed", err);
                if (retryCount < maxRetries) {
                    console.log(`Retrying... Attempt ${retryCount + 1}`);
                    retryCount++;
                    connectWithRetry();
                } else {
                    console.log("Maximum retries exceeded. Exiting...");
                    process.exit(1); // Exit the application after max retries
                }
            });
    } catch (error) {
        console.error("Invalid MongoDB URI:", error.message);
        process.exit(1); // Exit the application if URI is invalid
    }
}

connectWithRetry();