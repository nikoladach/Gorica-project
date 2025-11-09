import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database/db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { validatePassword } from '../utils/passwordValidator.js';

const router = express.Router();

// Enable strict password validation in production or via environment variable
const STRICT_PASSWORD_VALIDATION = process.env.STRICT_PASSWORD_VALIDATION === 'true' || process.env.NODE_ENV === 'production';

// POST /api/auth/register - Register a new user (optional, for admin use)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, name } = req.body;

    // Validation
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'username, password, and name are required'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        error: 'Username must be at least 3 characters long'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password, STRICT_PASSWORD_VALIDATION);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    const validRoles = ['doctor', 'esthetician'];
    const userRole = role && validRoles.includes(role) ? role : 'doctor';

    // Check if username already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Username already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      `INSERT INTO users (username, password_hash, role, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, name, created_at`,
      [username, passwordHash, userRole, name]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user);

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
      token, // Also return token in response for client-side storage if needed
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'development'
        ? `Registration failed: ${error.message}`
        : 'Registration failed'
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'username and password are required'
      });
    }

    // Find user by username
    const result = await query(
      'SELECT id, username, password_hash, role, name, is_active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // Don't reveal if username exists or not (security best practice)
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account is inactive. Please contact administrator.'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
      token, // Also return token in response for client-side storage if needed
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'development'
        ? `Login failed: ${error.message}`
        : 'Login failed'
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, (req, res) => {
  // Clear the token cookie
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// GET /api/auth/verify - Verify token and get current user
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      name: req.user.name,
    },
    authenticated: true,
  });
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      name: req.user.name,
    },
  });
});

export default router;

