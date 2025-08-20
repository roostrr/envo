const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  video_id: { type: String, required: true },
  title: { type: String, required: true },
  channel: { type: String, required: true },
  duration: { type: String, required: true },
  description: String,
  thumbnail: String,
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'expert'], required: true },
  classificationScore: Number, // Confidence score for difficulty classification
  viewCount: Number,
  publishedAt: Date
});

const TopicVideoPoolSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  videos: [VideoSchema],
  lastUpdated: { type: Date, default: Date.now },
  totalVideosAnalyzed: { type: Number, default: 0 },
  nextRefreshDue: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // 7 days from now
});

// Compound index for efficient topic lookup
TopicVideoPoolSchema.index({ topic: 1, 'videos.difficulty': 1 });

module.exports = mongoose.model('TopicVideoPool', TopicVideoPoolSchema);
