const mongoose = require('mongoose');

const slowModeRoomSchema = new mongoose.Schema({
  members: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A chatroom must have at least 1 member'],
    },
  ], // end of members
  messages: [
    {
      from: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A message must contain a user id'],
      },
      messageContent: {
        type: String,
        trim: true,
        required: [true, 'A message must have message content'],
      },
      messageType: {
        type: String,
        enum: ['text', 'image', 'sticker', 'gif', 'link'],
        default: 'text',
      },
      readReceipt: {
        sentAt: Date,
        read: {
          type: Boolean,
          default: false,
        },
        report: {
          isReported: {
            type: Boolean,
            default: false,
          },
          reportedReason: String,
          reportedAt: Date,
        },
      }, // end of readReceipt
    },
  ], // end of messages
  },
  { // options
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

slowModeRoomSchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'members',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
  ]);
  next();
});

slowModeRoomSchema.pre('save', function(next) {
  const d = new Date();
  const openableAt = d.setTime(d.getTime() + (1000 * 60 * 60 * 24))
  this.readReceipt.openableAt = openableAt;
  next();
});

const SlowModeRoom = mongoose.model('SlowModeRoom', slowModeRoomSchema);

module.exports = SlowModeRoom;