const Blog = require('../model/Blog');
const User = require('../model/User');
const Category = require('../model/Category');

// Create new blog
const createBlog = async (req, res) => {
  try {
    const { title, content, summary, category, tags, featuredImage } = req.body;

    // Validation
    if (!title || !content || !summary || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, summary and category are required'
      });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const newBlog = new Blog({
      title,
      content,
      summary,
      category,
      tags: tags || [],
      featuredImage,
      author: req.user.userId,
      status: 'published'
    });

    await newBlog.save();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: populatedBlog
    });

  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// Get all blogs with pagination and filtering
const getAllBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
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
      .populate('author', 'username fullName profilePicture')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / parseInt(limit));

    res.status(200).json({
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
    console.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blogs',
      error: error.message
    });
  }
};


// Search blogs
const searchBlogs = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const searchFilter = {
      status: 'published',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };
    
    const blogs = await Blog.find(searchFilter)
      .populate('author', 'username fullName profilePicture')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalBlogs = await Blog.countDocuments(searchFilter);
    
    res.status(200).json({
      success: true,
      data: {
        blogs,
        searchQuery: q,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBlogs / parseInt(limit)),
          totalBlogs
        }
      }
    });
    
  } catch (error) {
    console.error('Search blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search blogs',
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
      .populate('author', 'username fullName profilePicture')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBlogs = await Blog.countDocuments({
      category: category._id,
      status: 'published'
    });

    res.status(200).json({
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
    console.error('Get blogs by category error:', error);
    res.status(500).json({
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
      .populate('author', 'username fullName profilePicture')
      .populate('category', 'name slug')
      .sort({ likes: -1, views: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: blogs
    });

  } catch (error) {
    console.error('Get popular blogs error:', error);
    res.status(500).json({
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
      .populate('author', 'username fullName profilePicture bio')
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

    res.status(200).json({
      success: true,
      data: blog
    });

  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog',
      error: error.message
    });
  }
};

// Update blog
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, category, tags, featuredImage } = req.body;

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

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        content,
        summary,
        category,
        tags,
        featuredImage,
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('author', 'username fullName profilePicture')
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });

  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
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

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });

  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
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

    res.status(200).json({
      success: true,
      message: 'Blog liked successfully',
      data: { likes: blog.likes + 1 }
    });

  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({
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

    res.status(200).json({
      success: true,
      message: 'Blog unliked successfully',
      data: { likes: blog.likes - 1 }
    });

  } catch (error) {
    console.error('Unlike blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike blog',
      error: error.message
    });
  }
};

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogsByCategory,
  getPopularBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeBlog,
  unlikeBlog,
  getAllCategories
};