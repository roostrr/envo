const express = require('express');
const router = express.Router();
const SupportQuery = require('../models/SupportQuery');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// User submits a query
router.post('/query', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const supportQuery = new SupportQuery({
      userId: user._id,
      userName: user.firstName + ' ' + user.lastName,
      userEmail: user.email,
      message
    });
    await supportQuery.save();
    res.status(201).json({ success: true, query: supportQuery });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit query' });
  }
});

// User fetches their queries
router.get('/my-queries', auth, async (req, res) => {
  try {
    const queries = await SupportQuery.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ queries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

// Admin fetches all queries
router.get('/all-queries', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const queries = await SupportQuery.find().sort({ createdAt: -1 });
    res.json({ queries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all queries' });
  }
});

// Admin replies to a query
router.post('/reply', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { queryId, response } = req.body;
    const query = await SupportQuery.findById(queryId);
    if (!query) return res.status(404).json({ error: 'Query not found' });
    query.response = response;
    query.status = 'answered';
    await query.save();
    res.json({ success: true, query });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reply to query' });
  }
});

module.exports = router; 