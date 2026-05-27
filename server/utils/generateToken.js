const jwt = require('jsonwebtoken');
const { accessSecret, refreshSecret, accessExpire, refreshExpire } = require('../config/jwt');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, accessSecret, { expiresIn: accessExpire });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, refreshSecret, { expiresIn: refreshExpire });
};

module.exports = { generateAccessToken, generateRefreshToken };