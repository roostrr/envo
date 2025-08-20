const mongoose = require('mongoose');
const SummaryFeedbackSchema = new mongoose.Schema({
  topic: String,
  rating: { type: Number, min: 1, max: 5, required: true }, // 5-star rating
  comment: { type: String, default: '' }, // Optional written review
  sentiment_score: { type: Number, default: 0 }, // -1 to 1 (negative to positive)
  sentiment_label: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  summaryId: String, // optional, if you want to track specific summary versions
  createdAt: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update the updated_at field before saving
SummaryFeedbackSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('SummaryFeedback', SummaryFeedbackSchema); 