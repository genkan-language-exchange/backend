const mongoose = require('mongoose');

const friendsListSchema = new mongoose.Schema({
  // who this friend model belongs to
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  friendList: [
    {
      // a friend
      userId: { 
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      friendsSince: Date,
    }
  ],
},
{ // options
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

friendsListSchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'userId',
      select: 'name identifier _id matchSettings filterSettings accountStatus active role'
    },
    {
      path: 'friendList.userId',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
  ]);
  next();
});

// storySchema.index({ status: 1 })
// storySchema.index({ "likes.likeUser": 1, "userId": 1 }, { unique: true })

const FriendList = mongoose.model('FriendList', friendsListSchema);

module.exports = FriendList;