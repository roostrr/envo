const mongoose = require('mongoose');
const TopicSearchSchema = new mongoose.Schema({
  topic: { type: String, unique: true },
  count: { type: Number, default: 0 }
});
module.exports = mongoose.model('TopicSearch', TopicSearchSchema); 