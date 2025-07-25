const User = require('../model/User');
const Blog = require('../model/Blog');
const Category = require('../model/Category');

// Get admin dashboard statistics
const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBlogs = await Blog.countDocuments();
    const totalCategories = await Category.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const publishedBlogs = await Blog.countDocuments({ status: 'published' });
    
    // Get recent blogs
    const recentBlogs = await Blog.find()
      .populate('author', 'username fullName')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent users
    const recentUsers = await User.find()
      .select('username fullName email createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get top liked blogs
    const topBlogs = await Blog.find({ status: 'published' })
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ likes: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalBlogs,
          totalCategories,
          activeUsers,
          publishedBlogs
        },
        recentBlogs,
        recentUsers,
        topBlogs
      }
    });
    
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};

// Get all users for admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.isActive = status === 'active';
    }
    
    const users = await User.find(filter)
      .select('-password')
      .populate('blogs', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalUsers = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / parseInt(limit)),
          totalUsers
        }
      }
    });
    
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    // Prevent admin from deactivating themselves
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive, updatedAt: new Date() },
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete user's blogs
    await Blog.deleteMany({ author: id });
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Get all blogs for admin
const getAllBlogsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    const blogs = await Blog.find(filter)
      .populate('author', 'username fullName email')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalBlogs = await Blog.countDocuments(filter);
    
    res.status(200).json({
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
    console.error('Get all blogs admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blogs',
      error: error.message
    });
  }
};

// Update blog status
const updateBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['published', 'draft', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate('author', 'username fullName')
      .populate('category', 'name slug');
    
    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Blog status updated to ${status}`,
      data: updatedBlog
    });
    
  } catch (error) {
    console.error('Update blog status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog status',
      error: error.message
    });
  }
};

// Delete blog (admin)
const deleteBlogAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
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
    console.error('Delete blog admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    
    // Check if category exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug }] 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }
    
    const newCategory = new Category({
      name,
      slug,
      description,
      isActive: true
    });
    
    await newCategory.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
    
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    
    let updateData = { description, isActive, updatedAt: new Date() };
    
    if (name) {
      const slug = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
      updateData.name = name;
      updateData.slug = slug;
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has blogs
    const blogsCount = await Blog.countDocuments({ category: id });
    
    if (blogsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing blogs'
      });
    }
    
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllBlogsAdmin,
  updateBlogStatus,
  deleteBlogAdmin,
  createCategory,
  updateCategory,
  deleteCategory
};