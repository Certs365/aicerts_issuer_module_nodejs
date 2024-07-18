const jwt = require('jsonwebtoken');

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

module.exports = {
  generateJwtToken,
  generateRefreshToken
};
