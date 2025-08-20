const mongoose = require('mongoose');

const supportQuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  response: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportQuery', supportQuerySchema); 