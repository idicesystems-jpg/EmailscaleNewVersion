const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: false, message: 'Access denied. Token missing.' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET); // use same secret as login
    console.log("Decoded JWT:", user);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ status: false, message: 'Invalid or expired token.' });
  }
};

module.exports = authenticateToken;
