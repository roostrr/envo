const express = require('express');
const router = express.Router();
const ChatAgentFeedback = require('../models/ChatAgentFeedback');
const { spawn } = require('child_process');
const path = require('path');

// Helper function to analyze sentiment using Python service
const analyzeSentiment = async (text) => {
  return new Promise((resolve, reject) => {
    if (!text || text.trim().length < 3) {
      resolve({ score: 0, label: 'neutral' });
      return;
    }

    const pythonProcess = spawn('python', [
      path.join(__dirname, '../sentiment_analysis_handler.py'),
      '--text', text
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
        console.error('Python sentiment analysis error:', errorData);
        resolve({ score: 0, label: 'neutral' });
        return;
      }

      try {
        const result = JSON.parse(responseData);
        resolve(result);
      } catch (parseError) {
        console.error('Error parsing sentiment analysis response:', parseError);
        resolve({ score: 0, label: 'neutral' });
      }
    });
  });
};

// Submit chat agent feedback
router.post('/chat-feedback', async (req, res) => {
  try {
    const { student_id, conversation_id, rating, review_text, conversation_summary } = req.body;
    
    // Validate required fields
    if (!student_id || !conversation_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'student_id, conversation_id, and rating are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Analyze sentiment if review text provided
    let sentiment_data = { score: 0, label: 'neutral' };
    if (review_text && review_text.trim().length > 0) {
      sentiment_data = await analyzeSentiment(review_text);
    }
    
    const feedback = new ChatAgentFeedback({
      student_id,
      conversation_id,
      rating,
      review_text: review_text || '',
      sentiment_score: sentiment_data.score,
      sentiment_label: sentiment_data.label,
      conversation_summary: conversation_summary || ''
    });
    
    await feedback.save();
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback_id: feedback._id
    });
  } catch (error) {
    console.error('Error submitting chat feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
});

// Get sentiment analytics for admin
router.get('/chat-sentiment-analytics', async (req, res) => {
  try {
    const feedbacks = await ChatAgentFeedback.find().sort({ created_at: -1 });
    
    if (feedbacks.length === 0) {
      return res.json({
        success: true,
        data: {
          total_feedback: 0,
          average_rating: 0,
          sentiment_distribution: {
            positive: 0,
            negative: 0,
            neutral: 0
          },
          average_sentiment_score: 0,
          recent_feedback: [],
          rating_distribution: {
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
          }
        }
      });
    }
    
    // Calculate analytics
    const total_feedback = feedbacks.length;
    const average_rating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / total_feedback;
    
    const sentiment_distribution = {
      positive: feedbacks.filter(f => f.sentiment_label === 'positive').length,
      negative: feedbacks.filter(f => f.sentiment_label === 'negative').length,
      neutral: feedbacks.filter(f => f.sentiment_label === 'neutral').length
    };
    
    const average_sentiment_score = feedbacks.reduce((sum, f) => sum + f.sentiment_score, 0) / total_feedback;
    
    // Rating distribution
    const rating_distribution = {
      '1': feedbacks.filter(f => f.rating === 1).length,
      '2': feedbacks.filter(f => f.rating === 2).length,
      '3': feedbacks.filter(f => f.rating === 3).length,
      '4': feedbacks.filter(f => f.rating === 4).length,
      '5': feedbacks.filter(f => f.rating === 5).length
    };
    
    // Recent feedback (last 10)
    const recent_feedback = feedbacks.slice(0, 10).map(f => ({
      id: f._id,
      student_id: f.student_id,
      conversation_id: f.conversation_id,
      rating: f.rating,
      review_text: f.review_text,
      sentiment_score: f.sentiment_score,
      sentiment_label: f.sentiment_label,
      conversation_summary: f.conversation_summary,
      created_at: f.created_at
    }));
    
    const analytics = {
      total_feedback,
      average_rating: parseFloat(average_rating.toFixed(2)),
      sentiment_distribution,
      average_sentiment_score: parseFloat(average_sentiment_score.toFixed(3)),
      rating_distribution,
      recent_feedback,
      positive_percentage: parseFloat(((sentiment_distribution.positive / total_feedback) * 100).toFixed(1)),
      negative_percentage: parseFloat(((sentiment_distribution.negative / total_feedback) * 100).toFixed(1)),
      neutral_percentage: parseFloat(((sentiment_distribution.neutral / total_feedback) * 100).toFixed(1))
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting chat sentiment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics',
      error: error.message
    });
  }
});

// Get feedback by student ID
router.get('/chat-feedback/student/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    const feedbacks = await ChatAgentFeedback.find({ student_id }).sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error getting student feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving student feedback',
      error: error.message
    });
  }
});

// Get feedback by conversation ID
router.get('/chat-feedback/conversation/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const feedbacks = await ChatAgentFeedback.find({ conversation_id }).sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error getting conversation feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving conversation feedback',
      error: error.message
    });
  }
});

// Delete feedback (admin only)
router.delete('/chat-feedback/:feedback_id', async (req, res) => {
  try {
    const { feedback_id } = req.params;
    const deletedFeedback = await ChatAgentFeedback.findByIdAndDelete(feedback_id);
    
    if (!deletedFeedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: error.message
    });
  }
});

module.exports = router;
