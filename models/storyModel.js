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
  subscribed: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  comments: [
    {
      commenter: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A comment must belong to a user'],
      },
      content: String,
      originalContent: String,
      edited: Boolean,
      createdAt: Date,
      visible: {
        type: Boolean,
        default: true,
      }
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
      select: 'name identifier _id matchSettings accountStatus active role gravatar'
    },
    {
      path: 'comments.commenter',
      select: 'name identifier _id matchSettings accountStatus active role gravatar'
    },
    {
      path: 'likes.likeUser',
      select: 'name identifier _id matchSettings accountStatus active role gravatar'
    },
  ]);
  next();
});

// storySchema.index({ status: 1 })
// storySchema.index({ "likes.likeUser": 1, "userId": 1 }, { unique: true })

const Story = mongoose.model('Story', storySchema);

module.exports = Story;