const jwt = require('jsonwebtoken');


function generateJwtToken() {
    const expiresInMinutes = 2;
    const claims = {authType:"User"};
    const token = jwt.sign(claims, process.env.ACCESS_TOKEN_SECRET, { expiresIn: `${expiresInMinutes}d` });
    return token;
  }
  
  module.exports = {
    generateJwtToken,
  
  };