const mongoose = require('mongoose');

const ChatAgentFeedbackSchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  conversation_id: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true }, // 5-star rating
  review_text: { type: String, default: '' }, // Optional written review
  sentiment_score: { type: Number, default: 0 }, // -1 to 1 (negative to positive)
  sentiment_label: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
  conversation_summary: { type: String, default: '' }, // Brief summary of the conversation
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update the updated_at field before saving
ChatAgentFeedbackSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('ChatAgentFeedback', ChatAgentFeedbackSchema);
