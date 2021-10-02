const mongoose = require('mongoose');

const friendReqSchema = new mongoose.Schema({
  // who created the request
  sentBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // who the requests is for
  target: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // when other accepts, remove request and add to friendList
  // if request is rejected, set rejectedAt and compare to incoming requests
    // if < 2 weeks ago, reject immediately
  // after x rejections, automatically block and reject further requests
  status: {
    type: String,
    enum: ['rejected', 'pending'],
    default: 'pending',
  },
  createdAt: Date,
  rejectedAt: Date,
  attemptCount: {
    type: Number,
    default: 0,
  },
},
{ // options
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

friendReqSchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'sentBy',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
    {
      path: 'target',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
  ]);
  next();
});

storySchema.index({ "sentBy": 1, "target": 1 }, { unique: true })

const FriendRequest = mongoose.model('FriendRequest', friendReqSchema);

module.exports = FriendRequest;