const express = require('express');
const routes = express.Router();
const { adminAuth, auth } = require('../auth/auth.js');

/* -------------------- Blog routes  --------------------*/
const {
    getAllBlogs, getBlogByUserId, getBlogsByCategory, getPopularBlogs,
    getBlogById, getAllCategories, createBlog,
    updateBlog, deleteBlog, likeBlog, unlikeBlog } = require('../controller/BlogControl.js');

// Public Routes
routes.get('/blogs', getAllBlogs);
routes.get('/blogs/category/:categorySlug', getBlogsByCategory);
routes.get('/blogs/popular', getPopularBlogs);
routes.get('/blog/:id', getBlogById);
routes.get('/category', getAllCategories);
routes.get('/blogs/user/:id', getBlogByUserId);

routes.post('/blog', auth, createBlog);
routes.put('/blog', auth, updateBlog);
routes.delete('/blog/:id', auth, deleteBlog);
routes.post('/blog/:id/like', auth, likeBlog);
routes.post('/blog/:id/unlike', auth, unlikeBlog);

/* -------------------- Users routes  --------------------*/
const { register, login, getPublicProfile, getProfile, updateProfile, getMyBlogs, getLikedBlogs } = require('../controller/UserControl');

routes.post('/user/register', register);
routes.post('/user/login', login);
routes.get('/user/profile/:id', getPublicProfile);
routes.get('/user/profile', auth, getProfile);
routes.put('/user/profile', auth, updateProfile);
routes.get('/user/my-blogs', auth, getMyBlogs);
routes.get('/user/liked-blogs', auth, getLikedBlogs);

/* -------------------- Admin routes  --------------------*/
const {
    getDashboard,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getAllBlogsAdmin,
    updateBlogStatus,
    deleteBlogAdmin,
    createCategory,
    updateCategory,
    deleteCategory, 
    getCategories} = require('../controller/AdminControl');

// All admin routes require authentication and admin role
routes.get('/admin/dashboard', auth, adminAuth, getDashboard);
routes.get('/admin/users', auth, adminAuth, getAllUsers);
routes.put('/admin/user/status', auth, adminAuth, updateUserStatus);
routes.delete('/admin/user/:id', auth, adminAuth, deleteUser);

routes.get('/admin/blogs', auth, adminAuth, getAllBlogsAdmin);
routes.put('/admin/blog/status', auth, adminAuth, updateBlogStatus);
routes.delete('/admin/blog/:id', auth, adminAuth, deleteBlogAdmin);

routes.get('/admin/category', auth, adminAuth, getCategories);
routes.post('/admin/category', auth, adminAuth, createCategory);
routes.put('/admin/category', auth, adminAuth, updateCategory);
routes.delete('/admin/category/:id', auth, adminAuth, deleteCategory);

module.exports = routes;