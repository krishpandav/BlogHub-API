const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User.js');
const Blog = require('../model/Blog');
const { logMessage } = require('../common/log.js');
const { validate, userRegistrationSchema, userLoginSchema, userInfoUpdateSchema } = require('../validation/schema.js');
const folder = 'UserControl';

// Register new user
const register = async (req, res) => {
  try {

    const isValidReq = validate(req.body, userRegistrationSchema);
    if (isValidReq) {
      return res.status(400).json({ success: false, message: isValidReq });
    }

    const { username, email, password, fullname } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      fullname,
      role: 'user',
      isActive: true
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullname: newUser.fullname
      }
    });

  } catch (error) {
    console.log('Registration error:', error.message);
    logMessage(`${folder}/register`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {

    const isValidReq = validate(req.body, userLoginSchema);
    if (isValidReq) {
      return res.status(400).json({ success: false, message: isValidReq });
    }

    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({
      $or: [{ email: username }, { username }],
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          image: user.image
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    logMessage(`${folder}/login`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get user profile (authenticated user)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('blogs', 'title created_at likes views');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error.message);
    logMessage(`${folder}/getProfile`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Get public profile (any user)
const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('username fullname email bio image likedBlogs created_at');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get public profile error:', error.message);
    logMessage(`${folder}/getPublicProfile`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {

    const isValidReq = validate(req.body, userInfoUpdateSchema);
    if (isValidReq) {
      return res.status(400).json({ success: false, message: isValidReq });
    }

    const { fullname, bio, image } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { fullname, bio, image, updated_at: new Date() },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error.message);
    logMessage(`${folder}/updateProfile`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Get user's blogs
const getMyBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Blog.find({ author: req.user.userId })
      .populate('category', 'name slug')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBlogs = await Blog.countDocuments({ author: req.user.userId });

    return res.status(200).json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBlogs / parseInt(limit)),
          totalBlogs
        }
      }
    });

  } catch (error) {
    console.error('Get my blogs error:', error);
    logMessage(`${folder}/getMyBlogs`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blogs',
      error: error.message
    });
  }
};

// Get user's liked blogs
const getLikedBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(req.user.userId)
      .populate({
        path: 'likedBlogs',
        populate: [
          { path: 'author', select: 'username fullname image' },
          { path: 'category', select: 'name slug' }
        ],
        options: {
          sort: { created_at: -1 },
          skip: skip,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        blogs: user.likedBlogs,
        pagination: {
          currentPage: parseInt(page),
          totalBlogs: user.likedBlogs.length
        }
      }
    });

  } catch (error) {
    console.error('Get liked blogs error:', error.message);
    logMessage(`${folder}/getLikedBlogs`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get liked blogs',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getPublicProfile,
  updateProfile,
  getMyBlogs,
  getLikedBlogs
};
