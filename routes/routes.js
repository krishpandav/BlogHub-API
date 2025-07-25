const express = require('express');
const routes = express.Router();
const { adminMiddleware, authMiddleware } = require('../middleware/adminMiddleware');

/* -------------------- Blog routes  --------------------*/
const blogController = require('../controller/BlogControl.js');

routes.get('/blogs', blogController.getAllBlogs);
routes.get('/blogs/category/:categorySlug', blogController.getBlogsByCategory);
routes.get('/blogs/popular', blogController.getPopularBlogs);
routes.get('/blogs/:id', blogController.getBlogById);
routes.get('/category', blogController.getAllCategories);

routes.post('/blog', authMiddleware, blogController.createBlog);
routes.put('/blogs/:id', authMiddleware, blogController.updateBlog);
routes.delete('/blogs/:id', authMiddleware, blogController.deleteBlog);
routes.post('/blogs/:id/like', authMiddleware, blogController.likeBlog);
routes.post('/blogs/:id/unlike', authMiddleware, blogController.unlikeBlog);

/* -------------------- Users routes  --------------------*/
const { register, login, getPublicProfile, getProfile, updateProfile, getMyBlogs, getLikedBlogs } = require('../controller/UserControl');

routes.post('/user/register', register);
routes.post('/user/login', login);
routes.get('/user/profile/:id', getPublicProfile);

// Protected routes (require authentication)
routes.get('/user/profile', authMiddleware, getProfile);
routes.put('/user/profile', authMiddleware, updateProfile);
routes.get('/user/my-blogs', authMiddleware, getMyBlogs);
routes.get('/user/liked-blogs', authMiddleware, getLikedBlogs);


const adminController = require('../controller/AdminControl');

// ===== ADMIN ROUTES =====
// All admin routes require authentication and admin role
routes.get('/admin/dashboard', authMiddleware, adminMiddleware, adminController.getDashboard);
routes.get('/admin/users', authMiddleware, adminMiddleware, adminController.getAllUsers);
routes.put('/admin/users/:id/status', authMiddleware, adminMiddleware, adminController.updateUserStatus);
routes.delete('/admin/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);

routes.get('/admin/blogs', authMiddleware, adminMiddleware, adminController.getAllBlogsAdmin);
routes.put('/admin/blogs/:id/status', authMiddleware, adminMiddleware, adminController.updateBlogStatus);
routes.delete('/admin/blogs/:id', authMiddleware, adminMiddleware, adminController.deleteBlogAdmin);

routes.post('/admin/category', authMiddleware, adminMiddleware, adminController.createCategory);
routes.put('/admin/category/:id', authMiddleware, adminMiddleware, adminController.updateCategory);
routes.delete('/admin/category/:id', authMiddleware, adminMiddleware, adminController.deleteCategory);

module.exports = routes;