const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String, // Stores HTML from ReactQuill
        required: true
    },
    excerpt: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'General'
    },
    author: {
        name: { type: String, default: 'Dr. Arun Kumar' },
        title: { type: String, default: 'Ayurvedic Specialist' },
        avatar: { type: String }
    },
    tags: [String],
    readTime: {
        type: Number, // in minutes
        default: 5
    },
    featured: {
        type: Boolean,
        default: false
    },
    published: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
