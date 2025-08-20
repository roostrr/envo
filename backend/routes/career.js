const express = require('express');
const fetch = require('node-fetch');
const CareerForecast = require('../models/CareerForecast');

const router = express.Router();

// Get career forecasts (legacy, keep for now)
router.get('/', async (req, res) => {
  try {
    const forecasts = await CareerForecast.find({ isActive: true }).limit(10);
    res.json({ success: true, data: { forecasts } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get available occupations
router.get('/occupations', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5003/api/career-forecast/occupations');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch occupations from Python service' 
    });
  }
});

// Search occupations
router.post('/search', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5003/api/career-forecast/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search occupations from Python service' 
    });
  }
});

// Generate forecast for an occupation
router.post('/forecast', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5003/api/career-forecast/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate forecast from Python service' 
    });
  }
});

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5003/api/career-forecast/analytics');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics from Python service' 
    });
  }
});

// Get real-time data for an occupation
router.get('/realtime/:occupation', async (req, res) => {
  try {
    const { occupation } = req.params;
    const response = await fetch(`http://localhost:5003/api/career-forecast/realtime/${encodeURIComponent(occupation)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch real-time data from Python service' 
    });
  }
});

module.exports = router; 