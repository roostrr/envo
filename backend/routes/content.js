const express = require('express');
const Content = require('../models/Content');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get content by type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const content = await Content.getByType(type);
    res.json({ success: true, data: { content } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Create/Update content
router.post('/', adminAuth, async (req, res) => {
  try {
    const content = new Content(req.body);
    await content.save();
    res.json({ success: true, data: { content } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 