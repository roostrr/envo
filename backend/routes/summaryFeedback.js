const express = require('express');
const router = express.Router();
const SummaryFeedback = require('../models/SummaryFeedback');
const TopicSearch = require('../models/TopicSearch');
const { Parser } = require('json2csv');
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

// Submit feedback
router.post('/summary-feedback', async (req, res) => {
  const { topic, rating, comment, userId, summaryId } = req.body;
  
  try {
    // Validate required fields
    if (!topic || !rating) {
      return res.status(400).json({
        success: false,
        message: 'topic and rating are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Analyze sentiment if comment provided
    let sentiment_data = { score: 0, label: 'neutral' };
    if (comment && comment.trim().length > 0) {
      sentiment_data = await analyzeSentiment(comment);
    }

    const feedback = new SummaryFeedback({ 
      topic, 
      rating, 
      comment: comment || '', 
      userId, 
      summaryId,
      sentiment_score: sentiment_data.score,
      sentiment_label: sentiment_data.label
    });
    
    await feedback.save();
    res.json({ 
      success: true,
      message: 'Feedback submitted successfully',
      feedback_id: feedback._id
    });
  } catch (err) {
    console.error('Feedback save error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save feedback', 
      details: err.message 
    });
  }
});

// Increment topic search count
router.post('/topic-search', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Missing topic' });
  try {
    const result = await TopicSearch.findOneAndUpdate(
      { topic },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    res.json({ success: true, topic: result.topic, count: result.count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to increment topic search count' });
  }
});

// Get analytics for admin dashboard
router.get('/summary-feedback/analytics', async (req, res) => {
  try {
    const feedbacks = await SummaryFeedback.find().sort({ createdAt: -1 });
    const total = feedbacks.length;
    
    if (total === 0) {
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
          },
          topic_averages: [],
          topic_searches: [],
          total_sentiment_reviews: 0,
          positive_percentage: 0,
          negative_percentage: 0,
          neutral_percentage: 0
        }
      });
    }

    const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / total;
    
    // Only include sentiment analysis for reviews that were actually processed with sentiment analysis
    // (reviews with comments that went through the sentiment analysis system)
    // We can identify these by checking if the review has a comment AND was created after the sentiment system was implemented
    // The sentiment analysis system was implemented around the time we updated the schema
    // Let's use a timestamp-based approach: only include reviews created after a certain date
    const sentimentSystemStartDate = new Date('2025-08-16'); // Date when sentiment system was implemented
    
    const sentimentEnabledFeedbacks = feedbacks.filter(f => 
      f.comment && f.comment.trim().length > 0 && f.createdAt >= sentimentSystemStartDate
    );
    
    const sentiment_distribution = {
      positive: sentimentEnabledFeedbacks.filter(f => f.sentiment_label === 'positive').length,
      negative: sentimentEnabledFeedbacks.filter(f => f.sentiment_label === 'negative').length,
      neutral: sentimentEnabledFeedbacks.filter(f => f.sentiment_label === 'neutral').length
    };
    
    const total_sentiment_reviews = sentimentEnabledFeedbacks.length;
    const average_sentiment_score = total_sentiment_reviews > 0 
      ? sentimentEnabledFeedbacks.reduce((sum, f) => sum + f.sentiment_score, 0) / total_sentiment_reviews
      : 0;
    
    // Rating distribution
    const rating_distribution = {
      '1': feedbacks.filter(f => f.rating === 1).length,
      '2': feedbacks.filter(f => f.rating === 2).length,
      '3': feedbacks.filter(f => f.rating === 3).length,
      '4': feedbacks.filter(f => f.rating === 4).length,
      '5': feedbacks.filter(f => f.rating === 5).length
    };

    // Topic averages
    const byTopic = {};
    feedbacks.forEach(f => {
      if (!byTopic[f.topic]) byTopic[f.topic] = { count: 0, sum: 0 };
      byTopic[f.topic].count++;
      byTopic[f.topic].sum += f.rating;
    });
    const topic_averages = Object.entries(byTopic).map(([topic, { count, sum }]) => ({ 
      topic, 
      avg: count ? parseFloat((sum / count).toFixed(2)) : 0, 
      count 
    }));

    // Recent feedback (last 10)
    const recent_feedback = feedbacks.slice(0, 10).map(f => ({
      id: f._id,
      topic: f.topic,
      rating: f.rating,
      comment: f.comment,
      sentiment_score: f.sentiment_score,
      sentiment_label: f.sentiment_label,
      userId: f.userId,
      summaryId: f.summaryId,
      createdAt: f.createdAt
    }));

    // Get topic search analytics
    const topic_searches = await TopicSearch.find().sort({ count: -1 });

    const analytics = {
      total_feedback: total,
      average_rating: parseFloat(avgRating.toFixed(2)),
      sentiment_distribution,
      average_sentiment_score: parseFloat(average_sentiment_score.toFixed(3)),
      rating_distribution,
      recent_feedback,
      topic_averages,
      topic_searches,
      total_sentiment_reviews,
      positive_percentage: total_sentiment_reviews > 0 ? parseFloat(((sentiment_distribution.positive / total_sentiment_reviews) * 100).toFixed(1)) : 0,
      negative_percentage: total_sentiment_reviews > 0 ? parseFloat(((sentiment_distribution.negative / total_sentiment_reviews) * 100).toFixed(1)) : 0,
      neutral_percentage: total_sentiment_reviews > 0 ? parseFloat(((sentiment_distribution.neutral / total_sentiment_reviews) * 100).toFixed(1)) : 0
    };

    res.json({ success: true, data: analytics });
  } catch (err) {
    console.error('Error getting summary feedback analytics:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch analytics',
      details: err.message 
    });
  }
});

// Download all feedback as CSV
router.get('/summary-feedback/download', async (req, res) => {
  try {
    const feedbacks = await SummaryFeedback.find();
    const fields = ['topic', 'rating', 'comment', 'sentiment_score', 'sentiment_label', 'userId', 'summaryId', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(feedbacks);
    res.header('Content-Type', 'text/csv');
    res.attachment('envo_learn_feedback.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download feedback as CSV' });
  }
});

module.exports = router; 