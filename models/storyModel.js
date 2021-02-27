const mongoose = require('mongoose');
const User = require('./userModel');
const AppError = require('../utils/appError');

const storySchema = new mongoose.Schema({
  opUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A story must belong to a user'],
  },
  content: {
    type: String,
    required: [true, 'A story must have content'],
  },
  image: String,
  likes: [
    {
      likeUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A like must belong to a user'],
      },
    },
  ],
  report: {
    isReported: {
      type: Boolean,
      default: false,
    },
    reportedReason: String,
    reportedAt: Date,
  },
  postedDate: {
    type: Date,
    default: Date.now(),
  },
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;