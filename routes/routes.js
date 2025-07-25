const express = require('express');
const userController = require('../controller/UserControl');
const blogController = require('../controller/BlogControl');
const adminController = require('../controller/AdminControl');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// ===== USER ROUTES =====
// Public routes
router.post('/user/register', userController.register);
router.post('/user/login', userController.login);
router.get('/user/profile/:id', userController.getPublicProfile);

// Protected routes (require authentication)
router.get('/user/profile', authMiddleware, userController.getProfile);
router.put('/user/profile', authMiddleware, userController.updateProfile);
router.get('/user/my-blogs', authMiddleware, userController.getMyBlogs);
router.get('/user/liked-blogs', authMiddleware, userController.getLikedBlogs);

// ===== BLOG ROUTES =====
// Public routes
router.get('/blogs', blogController.getAllBlogs);
router.get('/blogs/search', blogController.searchBlogs);
router.get('/blogs/category/:categorySlug', blogController.getBlogsByCategory);
router.get('/blogs/popular', blogController.getPopularBlogs);
router.get('/blogs/:id', blogController.getBlogById);
router.get('/categories', blogController.getAllCategories);

// Protected routes (require authentication)
router.post('/blogs', authMiddleware, blogController.createBlog);
router.put('/blogs/:id', authMiddleware, blogController.updateBlog);
router.delete('/blogs/:id', authMiddleware, blogController.deleteBlog);
router.post('/blogs/:id/like', authMiddleware, blogController.likeBlog);
router.post('/blogs/:id/unlike', authMiddleware, blogController.unlikeBlog);

// ===== ADMIN ROUTES =====
// All admin routes require authentication and admin role
router.get('/admin/dashboard', authMiddleware, adminMiddleware, adminController.getDashboard);
router.get('/admin/users', authMiddleware, adminMiddleware, adminController.getAllUsers);
router.put('/admin/users/:id/status', authMiddleware, adminMiddleware, adminController.updateUserStatus);
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);

router.get('/admin/blogs', authMiddleware, adminMiddleware, adminController.getAllBlogsAdmin);
router.put('/admin/blogs/:id/status', authMiddleware, adminMiddleware, adminController.updateBlogStatus);
router.delete('/admin/blogs/:id', authMiddleware, adminMiddleware, adminController.deleteBlogAdmin);

router.post('/admin/categories', authMiddleware, adminMiddleware, adminController.createCategory);
router.put('/admin/categories/:id', authMiddleware, adminMiddleware, adminController.updateCategory);
router.delete('/admin/categories/:id', authMiddleware, adminMiddleware, adminController.deleteCategory);

module.exports = router;