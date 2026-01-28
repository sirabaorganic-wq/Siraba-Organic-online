const express = require('express');
const router = express.Router();
const {
    getBlogs,
    getAdminBlogs,
    getBlogBySlug,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog
} = require('../controllers/blogController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getBlogs)
    .post(protect, admin, createBlog);

router.route('/admin').get(protect, admin, getAdminBlogs);

router.route('/:slug').get(getBlogBySlug);

router.route('/id/:id')
    .get(protect, admin, getBlogById)
    .put(protect, admin, updateBlog)
    .delete(protect, admin, deleteBlog);

module.exports = router;
