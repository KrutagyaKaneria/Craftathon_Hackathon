import { Owner } from '../models/Owner.js';
import jsonwebtoken from 'jsonwebtoken';

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET || 'your_very_secure_jwt_secret_key_here_change_in_production';
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set in .env, using default fallback (DEVELOPMENT ONLY)');
  }
  return secret;
};

export const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    console.log('📝 Owner Signup:', { email });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if owner already exists
    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new owner
    const owner = new Owner({
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || ''
    });

    await owner.save();
    console.log('✅ Owner created:', owner._id);

    // Generate token
    const token = jsonwebtoken.sign(
      { ownerId: owner._id, type: 'owner' },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Owner registered successfully',
      data: {
        ownerId: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        token
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error during signup'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Owner Login:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find owner and select password field
    const owner = await Owner.findOne({ email }).select('+password');

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await owner.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = jsonwebtoken.sign(
      { ownerId: owner._id, type: 'owner' },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    console.log('✅ Owner logged in:', owner._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        ownerId: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        phone: owner.phone,
        token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error during login'
    });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jsonwebtoken.verify(token, getJWTSecret());
    const owner = await Owner.findById(decoded.ownerId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    res.json({
      success: true,
      data: {
        ownerId: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName
      }
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const ownerId = req.body.ownerId || req.query.ownerId || req.params.ownerId;

    const owner = await Owner.findById(ownerId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    res.json({
      success: true,
      data: {
        ownerId: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        phone: owner.phone,
        totalDrivers: owner.totalDrivers,
        totalVehicles: owner.totalVehicles
      }
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

/**
 * Debug endpoint - Test token validity and debug auth issues
 * POST /api/auth/debug-token
 * Body: { token: "your_jwt_token" }
 */
export const debugToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token required in request body',
        example: { token: 'your_jwt_token_here' }
      });
    }

    const JWT_SECRET = getJWTSecret();
    
    console.log('\ud83d\udd0d Debug: Attempting to verify token...');
    console.log('Test token:', token.substring(0, 30) + '...');
    console.log('JWT_SECRET:', JWT_SECRET.substring(0, 20) + '...');

    // Try to decode without verifying (to see payload)
    const unverified = jsonwebtoken.decode(token, { complete: true });
    console.log('Decoded payload:', unverified?.payload);

    // Verify token
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);
    
    console.log('✅ Token is valid!');
    console.log('Decoded:', decoded);

    const owner = await Owner.findById(decoded.ownerId);

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        ownerId: decoded.ownerId,
        owner: owner ? { email: owner.email, _id: owner._id, firstName: owner.firstName, lastName: owner.lastName } : null,
        payload: unverified?.payload,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Debug token error:', error.message);
    res.status(400).json({
      success: false,
      message: 'Token validation failed',
      error: error.message,
      tokenInfo: {
        decoded: jsonwebtoken.decode(req.body.token, { complete: true })
      }
    });
  }
};
