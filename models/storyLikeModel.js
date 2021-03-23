const mongoose = require('mongoose');

const storyLikeSchema = new mongoose.Schema({
  storyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Story',
    required: [true, 'A like must belong to a story'],
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A like must belong to a user'],
  },
  likeType: {
    type: String,
    default: 'heart',
  }
});

const StoryLike = mongoose.model('StoryLike', storyLikeSchema);

module.exports = StoryLike;