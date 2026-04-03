import jsonwebtoken from 'jsonwebtoken';

// Use the exact same JWT_SECRET as authController.js
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET || 'your_very_secure_jwt_secret_key_here_change_in_production';
  return secret;
};

export const verifyAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      console.error('❌ No token in Authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    console.log('🔍 Token found, verifying...', token.substring(0, 20) + '...');
    
    // Decode first to inspect payload WITHOUT verifying
    const unverified = jsonwebtoken.decode(token, { complete: true });
    console.log('📋 Token payload (unverified):', {
      ownerId: unverified?.payload?.ownerId,
      exp: unverified?.payload?.exp ? new Date(unverified.payload.exp * 1000).toISOString() : 'N/A',
      iat: unverified?.payload?.iat ? new Date(unverified.payload.iat * 1000).toISOString() : 'N/A'
    });

    const JWT_SECRET = getJWTSecret();
    console.log('🔑 JWT_SECRET from env:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    console.log('🔑 Using JWT_SECRET (first 30 chars):', JWT_SECRET.substring(0, 30) + '...');
    
    // Now verify with the secret
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);
    console.log('✅ Token verified successfully, ownerId:', decoded.ownerId);
    
    // Set ownerId for Owner-based multi-tenant architecture
    req.ownerId = decoded.ownerId;
    req.user = { id: decoded.ownerId, ownerId: decoded.ownerId };
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    console.error('❌ Error details:', error.name);
    
    // Try to decode to show what went wrong
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jsonwebtoken.decode(token, { complete: true });
        console.error('❌ Decoded token info:', {
          header: decoded?.header,
          payload: { ownerId: decoded?.payload?.ownerId, exp: decoded?.payload?.exp },
          valid: false,
          reason: error.message
        });
      } catch (e) {
        console.error('❌ Could not decode token');
      }
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token',
      error: error.message,
      debug: process.env.NODE_ENV === 'development' ? { errorName: error.name, tokenInfo: 'See server logs' } : undefined
    });
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};
