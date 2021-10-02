const mongoose = require('mongoose')

const chatroomSchema = new mongoose.Schema({
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
      }, // end of readReceipt
    },
  ], // end of messages
},
{
  discriminatorKey: 'type',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
}
)

chatroomSchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'members',
      select: 'name identifier _id matchSettings accountStatus active role'
    },
  ]);
  next();
});

const Chatroom = mongoose.model('Chatroom', chatroomSchema)

module.exports = Chatroom