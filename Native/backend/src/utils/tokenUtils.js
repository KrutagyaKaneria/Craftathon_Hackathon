export const generateToken = (userId) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
  const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
  
  const jwt = require('jsonwebtoken');
  
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const generateTokens = (userId) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key';
  
  const jwt = require('jsonwebtoken');
  
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

export const verifyToken = (token) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
  const jwt = require('jsonwebtoken');
  
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
