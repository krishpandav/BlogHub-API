const { v4: uuidv4 } = require('uuid');
const path = require('path')
const fs = require('fs');
const Blog = require('../model/Blog');
const User = require('../model/User');
const Category = require('../model/Category');
const { logMessage } = require('../common/log.js');
const { validate, blogCreateSchema, updateBlogSchema, getAllBlogsSchema } = require('../validation/schema.js');
const folder = 'BlogControl';

// Create new blog
const createBlog = async (req, res) => {
  try {
    const { title, content, summary, category, tags, image, status } = req.body;

    const isValidReq = validate(req.body, blogCreateSchema);
    if (isValidReq) {
      return res.status(400).json({ success: false, message: isValidReq });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    let imagePath = '';
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate unique filename
      const uniqueId = uuidv4().replace(/-/g, '').slice(0, 8); // 8-char unique ID
      const fileName = `${uniqueId}-blog-image.png`; // e.g., 12354654-blog-image.png
      imagePath = `http://localhost:5051/uploads/${fileName}`;

      // Save image to uploads folder
      fs.writeFileSync(path.join(__dirname, '..', `/uploads/${fileName}`), buffer);
    }

    const newBlog = new Blog({
      title,
      content,
      summary,
      category,
      tags: tags || [],
      image: imagePath, // Store the file path in the database
      author: req.user.userId,
      status: status
    });

    await newBlog.save();

    const populatedBlog = await Blog.findById(newBlog._id)
      .populate('category')
      .populate('author', 'username email');

    return res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: populatedBlog
    });

  } catch (error) {
    console.error('Create blog error:', error.message);
    logMessage(`${folder}/createBlog`, error, req); // Assuming folder is defined
    return res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// Get all blogs with pagination and filtering
const getAllBlogs = async (req, res) => {
  try {

    const isValidReq = validate(req.query, getAllBlogsSchema);
    if (isValidReq) {
      return res.status(400).json({ success: false, message: isValidReq });
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      searchtext,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Base query
    const query = { status: 'published' };

    // If searchtext is provided, add search conditions
    if (searchtext) {
      query.$or = [
        { title: { $regex: searchtext, $options: 'i' } },
        { summary: { $regex: searchtext, $options: 'i' } },
        { content: { $regex: searchtext, $options: 'i' } },
        { tags: { $in: [new RegExp(searchtext, 'i')] } }
      ];
    }

    const blogs = await Blog.find(query)
      .populate('author', 'username fullname image')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBlogs,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all blogs error:', error.message);
    logMessage(`${folder}/getAllBlogs`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blogs',
      error: error.message
    });
  }
};

const getBlogByUserId = async (req, res) => {
  try {
    const { id } = req.params;

    // Build query
    const query = {};
    if (id) query.author = id; // filter blogs by user ID

    // Fetch blogs
    const blogs = await Blog.find(query)
      .populate('author', 'username fullname image')
      .populate('category', 'name slug')
      .sort({ ['created_at']: -1 });

    return res.status(200).json({
      success: true,
      blogs
    });

  } catch (error) {
    console.error('Get blog by user ID error:', error.message);
    logMessage(`${folder}/getBlogByUserId`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blogs',
      error: error.message
    });
  }
};

// Get blogs by category
const getBlogsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Find category
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Blog.find({
      category: category._id,
      status: 'published'
    })
      .populate('author', 'username fullname image')
      .populate('category', 'name slug')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBlogs = await Blog.countDocuments({
      category: category._id,
      status: 'published'
    });

    return res.status(200).json({
      success: true,
      data: {
        category,
        blogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBlogs / parseInt(limit)),
          totalBlogs
        }
      }
    });

  } catch (error) {
    console.error('Get blogs by category error:', error.message);
    logMessage(`${folder}/getBlogsByCategory`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blogs by category',
      error: error.message
    });
  }
};

// Get popular blogs
const getPopularBlogs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'username fullname image')
      .populate('category', 'name slug')
      .sort({ likes: -1, views: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: blogs
    });

  } catch (error) {
    console.error('Get popular blogs error:', error.message);
    logMessage(`${folder}/getPopularBlogs`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get popular blogs',
      error: error.message
    });
  }
};

// Get single blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id)
      .populate('author', 'username fullname image bio')
      .populate('category', 'name slug');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment view count
    await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });
    blog.views += 1;

    return res.status(200).json({
      success: true,
      data: blog
    });

  } catch (error) {
    console.error('Get blog by ID error:', error.message);
    logMessage(`${folder}/getBlogById`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blog',
      error: error.message
    });
  }
};

// Update blog
const updateBlog = async (req, res) => {
  try {
    const { id, title, content, summary, category, tags, image } = req.body;

    const isValidReq = validate(req.body, updateBlogSchema);
    if (isValidReq) {
      return res.status(400).json({ success: false, message: isValidReq });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this blog'
      });
    }

    let imagePath = '';
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate unique filename
      const uniqueId = uuidv4().replace(/-/g, '').slice(0, 8); // 8-char unique ID
      const fileName = `${uniqueId}-blog-image.png`; // e.g., 12354654-blog-image.png
      imagePath = `http://localhost:5051/uploads/${fileName}`;

      // Save image to uploads folder
      fs.writeFileSync(path.join(__dirname, '..', `/uploads/${fileName}`), buffer);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        content,
        summary,
        category,
        tags,
        image: imagePath,
        updated_at: new Date()
      },
      { new: true }
    )
      .populate('author', 'username fullname image')
      .populate('category', 'name slug');

    return res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });

  } catch (error) {
    console.error('Update blog error:', error.message);
    logMessage(`${folder}/updateBlog`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
};

// Delete blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is the author or admin
    if (blog.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this blog'
      });
    }

    await Blog.findByIdAndDelete(id);

    // Remove from user's blogs array
    await User.findByIdAndUpdate(blog.author, {
      $pull: { blogs: id }
    });

    return res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });

  } catch (error) {
    console.error('Delete blog error:', error.message);
    logMessage(`${folder}/deleteBlog`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

// Like blog
const likeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const user = await User.findById(userId);

    // Check if already liked
    if (user.likedBlogs.includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Blog already liked'
      });
    }

    // Add like
    await Blog.findByIdAndUpdate(id, { $inc: { likes: 1 } });
    await User.findByIdAndUpdate(userId, { $push: { likedBlogs: id } });

    return res.status(200).json({
      success: true,
      message: 'Blog liked successfully',
      data: { likes: blog.likes + 1 }
    });

  } catch (error) {
    console.error('Like blog error:', error.message);
    logMessage(`${folder}/likeBlog`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to like blog',
      error: error.message
    });
  }
};

// Unlike blog
const unlikeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const user = await User.findById(userId);

    // Check if not liked
    if (!user.likedBlogs.includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Blog not liked yet'
      });
    }

    // Remove like
    await Blog.findByIdAndUpdate(id, { $inc: { likes: -1 } });
    await User.findByIdAndUpdate(userId, { $pull: { likedBlogs: id } });

    return res.status(200).json({
      success: true,
      message: 'Blog unliked successfully',
      data: { likes: blog.likes - 1 }
    });

  } catch (error) {
    console.error('Unlike blog error:', error.message);
    logMessage(`${folder}/unlikeBlog`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlike blog',
      error: error.message
    });
  }
};

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "category",
          as: "blogs"
        }
      },
      {
        $addFields: {
          blogCount: { $size: "$blogs" }
        }
      },
      { $project: { blogs: 0 } }, // remove blogs array
      { $sort: { name: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogByUserId,
  getBlogsByCategory,
  getPopularBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeBlog,
  unlikeBlog,
  getAllCategories
};