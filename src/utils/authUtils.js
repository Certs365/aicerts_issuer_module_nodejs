const jwt = require('jsonwebtoken');

function generateJwtToken() {
  try {
    const expiresInMinutes = 2;
    const claims = { authType: "User" };
    const token = jwt.sign(claims, process.env.ACCESS_TOKEN_SECRET, { expiresIn: `${expiresInMinutes}d` });
    return token;
  } catch (error) {
    console.error("Error generating JWT token:", error);
    throw error; 
  }
}

module.exports = {
  generateJwtToken,
};
