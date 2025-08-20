const express = require('express');
const { auth } = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

// AI Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, student_id } = req.body;
    
    if (!message || !student_id) {
      return res.status(400).json({
        success: false,
        message: 'Message and student_id are required'
      });
    }

    // Don't load previous conversations - start fresh each time
    const conversation_history = [];
    
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ai_chat_handler.py'),
      '--message', message,
      '--student_id', student_id
    ]);

    let responseData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      responseData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', errorData);
        return res.status(500).json({
          success: false,
          message: 'Error processing AI response',
          error: errorData
        });
      }

      try {
        const result = JSON.parse(responseData);
        res.json({
          success: true,
          data: result
        });
      } catch (parseError) {
        console.error('Error parsing Python response:', parseError);
        res.status(500).json({
          success: false,
          message: 'Error parsing AI response',
          error: responseData
        });
      }
    });

  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get conversations for a specific student (for admin analysis)
router.get('/conversations/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Return empty array since we don't load previous conversations
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving conversations'
    });
  }
});

// Update callback status
router.post('/callback', async (req, res) => {
  try {
    const { student_id, conversation_index, callback_requested } = req.body;
    
    const pythonProcess = spawn('python3', [
      path.join(__dirname, '../update_callback.py'),
      '--student_id', student_id,
      '--conversation_index', conversation_index.toString(),
      '--callback_requested', callback_requested.toString()
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: 'Error updating callback status'
        });
      }

      res.json({
        success: true,
        message: 'Callback status updated successfully'
      });
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get ML model metrics (admin only)
router.get('/metrics', async (req, res) => {
  try {
    const pythonProcess = spawn('python3', [
      path.join(__dirname, '../get_model_metrics.py')
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: 'Error retrieving model metrics'
        });
      }

      try {
        const metrics = JSON.parse(result);
        res.json({
          success: true,
          data: metrics
        });
      } catch (parseError) {
        res.status(500).json({
          success: false,
          message: 'Invalid response format'
        });
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get conversations data for admin analysis
router.get('/conversations-data', async (req, res) => {
  try {
    const pythonProcess = spawn('python3', [
      path.join(__dirname, '../get_conversations_data.py')
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: 'Error retrieving conversations data'
        });
      }

      try {
        const data = JSON.parse(result);
        res.json({
          success: true,
          data: data
        });
      } catch (parseError) {
        res.status(500).json({
          success: false,
          message: 'Invalid response format'
        });
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Retrain model (admin only)
router.post('/retrain', async (req, res) => {
  try {
    const pythonProcess = spawn('python3', [
      path.join(__dirname, '../retrain_model.py')
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: 'Error retraining model'
        });
      }

      try {
        const response = JSON.parse(result);
        res.json({
          success: true,
          message: 'Model retrained successfully',
          data: response
        });
      } catch (parseError) {
        res.status(500).json({
          success: false,
          message: 'Invalid response format'
        });
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router; 