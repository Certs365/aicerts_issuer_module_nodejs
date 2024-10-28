// Retry utility function
async function retryOperation(operation, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === retries) throw error; // If all attempts fail, throw the error
            console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay)); // Wait before retrying
        }
    }
}
module.exports = retryOperation