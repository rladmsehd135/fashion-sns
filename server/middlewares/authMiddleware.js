const jwt = require('jsonwebtoken');
const { accessSecret } = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '토큰이 없습니다.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, accessSecret);
    req.userId    = decoded.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '토큰이 만료되었습니다.', expired: true });
    }
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = authMiddleware;