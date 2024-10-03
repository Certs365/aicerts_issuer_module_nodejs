const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

function generateJwtToken() {
  try {
    const expiresInMinutes = process.env.JWT_EXPIRE;
    const claims = { authType: "User" };
    const token = jwt.sign(claims, process.env.ACCESS_TOKEN_SECRET, { expiresIn: `${expiresInMinutes}${process.env.JWT_EXPIRE_TIME}` });
    return token;
  } catch (error) {
    console.error("Error generating JWT token:", error);
    throw error; 
  }
}

function generateRefreshToken(user) {
  try {
    const expiresInDays = process.env.REFRESH_TOKEN_EXPIRE;
    const claims = { authType: "User", userId: user._id };
    const refreshToken = jwt.sign(claims, process.env.REFRESH_TOKEN, { expiresIn: `${expiresInDays}${process.env.REFRESH_TOKEN_EXPIRE_TIME}` });
    return refreshToken
  } catch (error) {
    console.error("Error generating refresh token:", error);
    throw error; 
  }
}


  // Middleware to decrypt the request body
  const decryptRequestBody = (req, res, next) => {
    try {
        const key = process.env.ENCRYPTION_KEY; // Use an environment variable for the encryption key
        const encryptedData = req.body.data; // Assuming the encrypted data is sent in the request body as 'data'

        // Check if 'data' field exists in the request body
        if (encryptedData) {
            // Decrypt the data
            const decryptedData = decryptData(encryptedData, key);

            // Replace the body with decrypted data
            req.body = decryptedData;
        }

        // Call the next middleware or controller
        next();
    } catch (error) {
        res.status(400).json({ message: 'Failed to decrypt request data' });
    }
};

const decryptRequestParseBody = (req, res, next) => {
  try {
    const key = process.env.ENCRYPTION_KEY; // Use an environment variable for the encryption key
    const encryptedData = req.body.data; // Assuming the encrypted data is sent in the request body as 'encryptedData'
    if (encryptedData) {
      // Decrypt the data
      const decryptedData = decryptData(encryptedData, key);
      console.log(key, "key")
      console.log(encryptedData, "encrypt")
      console.log(decryptedData, "dycrypt")
      req.body = decryptedData;
    }
    // Call the next middleware or controller
    next();
  } catch (error) {
    res.status(400).json({ message: 'Failed to decrypt request data' });
  }
};

// Decrypt function
const decryptData = (encryptedData, key) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted); // Parse the string to get the original data
};

module.exports = {
  generateJwtToken,
  generateRefreshToken,
  decryptRequestBody,
  decryptRequestParseBody
};
