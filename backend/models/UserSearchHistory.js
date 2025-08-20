const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema({
  sessionId: { type: String, required: true }, // For anonymous users
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For logged-in users
  topic: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now },
  videosShown: [{
    video_id: String,
    difficulty: String,
    position: Number // Position in the recommendation (1-5)
  }],
  userInteraction: {
    summaryRating: Number,
    videosClicked: [String], // Array of video_ids clicked
    timeSpentOnPage: Number // In seconds
  }
});

// Index for efficient queries
SearchHistorySchema.index({ topic: 1, sessionId: 1, searchedAt: -1 });
SearchHistorySchema.index({ userId: 1, searchedAt: -1 });

module.exports = mongoose.model('UserSearchHistory', SearchHistorySchema);
