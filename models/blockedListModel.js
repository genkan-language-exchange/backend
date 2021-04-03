const mongoose = require('mongoose');

const blockedListSchema = new mongoose.Schema({
  // who this block model belongs to
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  blockedList: [
    {
      // a friend
      userId: { 
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      createdAt: Date,
    }
  ],
},
{ // options
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

blockedListSchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'userId',
      select: 'name identifier _id matchSettings filterSettings accountStatus active role'
    },
    {
      path: 'blockedList.userId',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
  ]);
  next();
});

const BlockedList = mongoose.model('BlockedList', blockedListSchema);

module.exports = BlockedList;