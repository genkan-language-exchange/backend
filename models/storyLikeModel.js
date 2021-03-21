const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
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
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;