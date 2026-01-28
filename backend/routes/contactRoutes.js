const express = require('express');
const router = express.Router();
const ContactSubmission = require('../models/ContactSubmission');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Submit a contact form
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body;
        const newSubmission = await ContactSubmission.create({
            firstName,
            lastName,
            email,
            subject,
            message
        });
        res.status(201).json(newSubmission);
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all contact submissions
// @route   GET /api/contact
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const submissions = await ContactSubmission.find({}).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching contact submissions:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update contact message status
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const submission = await ContactSubmission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Message not found' });
        }

        submission.status = status || submission.status;
        if (adminNotes !== undefined) {
            submission.adminNotes = adminNotes;
        }
        if (status === 'Read' && !submission.readAt) {
            submission.readAt = new Date();
        }

        await submission.save();
        res.json(submission);
    } catch (error) {
        console.error('Error updating contact status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const submission = await ContactSubmission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Message not found' });
        }

        await submission.deleteOne();
        res.json({ message: 'Contact message deleted' });
    } catch (error) {
        console.error('Error deleting contact message:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
