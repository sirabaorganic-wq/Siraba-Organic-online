const BlogPost = require('../models/BlogPost');

// @desc    Get all blog posts
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
    try {
        const { category, tag } = req.query;
        let query = { published: true };

        if (category && category !== 'All') {
            query.category = category;
        }
        if (tag) {
            query.tags = { $in: [tag] };
        }

        const blogs = await BlogPost.find(query).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all blog posts (Admin - includes drafts)
// @route   GET /api/blogs/admin
// @access  Private/Admin
const getAdminBlogs = async (req, res) => {
    try {
        const blogs = await BlogPost.find({}).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single blog post by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
    try {
        const blog = await BlogPost.findOne({ slug: req.params.slug, published: true });
        if (blog) {
            res.json(blog);
        } else {
            res.status(404).json({ message: 'Blog post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single blog post by ID (Admin)
// @route   GET /api/blogs/id/:id
// @access  Private/Admin
const getBlogById = async (req, res) => {
    try {
        const blog = await BlogPost.findById(req.params.id);
        if (blog) {
            res.json(blog);
        } else {
            res.status(404).json({ message: 'Blog post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a blog post
// @route   POST /api/blogs
// @access  Private/Admin
const createBlog = async (req, res) => {
    try {
        const { title, content, excerpt, image, category, tags, featured } = req.body;

        // Generate slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const blog = new BlogPost({
            title,
            slug,
            content,
            excerpt,
            image,
            category,
            tags,
            featured
        });

        const createdBlog = await blog.save();
        res.status(201).json(createdBlog);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a blog post
// @route   PUT /api/blogs/:id
// @access  Private/Admin
const updateBlog = async (req, res) => {
    try {
        const { title, content, excerpt, image, category, tags, featured, published } = req.body;

        const blog = await BlogPost.findById(req.params.id);

        if (blog) {
            blog.title = title || blog.title;
            blog.content = content || blog.content;
            blog.excerpt = excerpt || blog.excerpt;
            blog.image = image || blog.image;
            blog.category = category || blog.category;
            blog.tags = tags || blog.tags;
            blog.featured = featured !== undefined ? featured : blog.featured;
            blog.published = published !== undefined ? published : blog.published;

            // Re-generate slug if title changed (optional, usually kept same for SEO)
            if (title && title !== blog.title) {
                blog.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            const updatedBlog = await blog.save();
            res.json(updatedBlog);
        } else {
            res.status(404).json({ message: 'Blog post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a blog post
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
const deleteBlog = async (req, res) => {
    try {
        const blog = await BlogPost.findById(req.params.id);

        if (blog) {
            await blog.deleteOne();
            res.json({ message: 'Blog removed' });
        } else {
            res.status(404).json({ message: 'Blog post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getBlogs,
    getAdminBlogs,
    getBlogBySlug,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog
};
