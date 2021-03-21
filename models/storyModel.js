const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A story must belong to a user'],
  },
  content: {
    type: String,
    required: [true, 'A story must have content'],
  },
  originalContent: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  image: String,
  comments: [
    {
      userId: String,
      content: String,
      createdAt: Date,
    }
  ],
  likes: [
    {
      likeUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A like must belong to a user'],
      },
      createdAt: Date,
    },
  ],
  report: {
    isReported: Boolean,
    reportDetails: [
      {
        reportedReason: String,
        reportedAt: Date,
        reportedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'A report must reference the user who reports it ']
          },
      },
    ],
  },
  status: {
    type: String,
    enum: ['deleted', 'draft', 'visible'],
    default: 'visible',
  }
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;