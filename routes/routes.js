const express = require('express');
const routes = express.Router();
const { adminMiddleware, authMiddleware } = require('../middleware/adminMiddleware');

/* -------------------- Blog routes  --------------------*/
const blogController = require('../controller/BlogControl.js');

routes.get('/blogs', blogController.getAllBlogs);
routes.get('/blogs/search', blogController.searchBlogs);
routes.get('/blogs/category/:categorySlug', blogController.getBlogsByCategory);
routes.get('/blogs/popular', blogController.getPopularBlogs);
routes.get('/blogs/:id', blogController.getBlogById);
routes.get('/categories', blogController.getAllCategories);

/* -------------------- Users routes  --------------------*/
const { register, login, getPublicProfile } = require('../controller/UserControl');

routes.post('/user/register', register);
routes.post('/user/login', login);
routes.get('/user/profile/:id', getPublicProfile);

module.exports = routes;