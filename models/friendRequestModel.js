const mongoose = require('mongoose');

const friendReqSchema = new mongoose.Schema({
  // who this request model belongs to
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // requests sent by the user go here
  sentRequests: [
    {
      // when other accepts, remove from req list and place in friendList
      // if request is rejected, set modifiedAt and remove after 2~4 weeks
      // a user being blocked should still allow a request to go through to curb harassment, but be immediately rejected ??? MAYBE?
      // after x rejections, automatically block and reject further requests
      status: {
        type: String,
        enum: ['rejected', 'pending'],
        default: 'pending',
      },
      createdAt: Date,
      modifiedAt: Date,
      attemptCount: {
        type: Number,
        default: 0,
      },
    },
  ],
  // requests other users receive go here
  requests: [
    {
      userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        validate: {
          message: "User attempted to send a friend request to themself",
          validator: function(val) {
            return this.userId !== val
          }
        }
      },
      // same concept, if request is rejected change the modifiedAt date and remove after 2,3,4,x weeks (customisable in filterSettings?)
      createdAt: Date,
      modifiedAt: Date,
      clearAt: Date,
      status: {
        type: String,
        enum: ['rejected', 'pending'],
        default: 'pending',
      },
    }
  ],
},
{ // options
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// friendReqSchema.pre(/^find/, function(next) {
//   this.populate([
//     {
//       path: 'userId',
//       select: 'name identifier _id matchSettings accountStatus active role'
//     },
//     {
//       path: 'sentRequests.userId',
//       select: 'name identifier _id matchSettings accountStatus active role'
//     },
//     {
//       path: 'requests.userId',
//       select: 'name identifier _id matchSettings accountStatus active role'
//     },
//   ]);
//   next();
// });

// storySchema.index({ "requests.userId": 1, "userId": 1 }, { unique: true })

const FriendRequest = mongoose.model('FriendRequest', friendReqSchema);

module.exports = FriendRequest;