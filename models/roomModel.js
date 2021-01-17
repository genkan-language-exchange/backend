const mongoose = require('mongoose');
const User = require('./userModel');

const roomSchema = new mongoose.Schema({
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
        type: String,
        required: [true, 'A message must contain a user id'],
      },
      message: {
        type: String,
        trim: true,
        required: [true, 'A message must have message content'],
      },
      readReceipt: {
        sentAt: {
          type: Date,
          default: Date.now(),
        },
        read: {
          type: Boolean,
          default: false,
        },
        reported: {
          type: Boolean,
          default: false,
        },
        reportedAt: Date,
      }, // end of readReceipt
    },
  ], // end of messages
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;