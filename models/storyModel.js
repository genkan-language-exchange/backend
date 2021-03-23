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
      commenter: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A like must belong to a user'],
      },
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
      createdAt: {
        type: Date,
        default: Date.now()
      },
      likeType: {
        type: String,
        default: 'heart',
      }
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
},
{ // options
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

storySchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'userId',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
    {
      path: 'comments.commenter',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
    {
      path: 'likes.likeUser',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
  ]);
  next();
});


const Story = mongoose.model('Story', storySchema);

module.exports = Story;