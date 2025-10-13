const jwt = require("jsonwebtoken");

/**
 * Serverless-safe token verification
 * @param {string} token - JWT token string
 * @returns {Object|null} decoded user object or null if invalid
 */
async function verifyTokenServerless(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

module.exports = verifyTokenServerless;
