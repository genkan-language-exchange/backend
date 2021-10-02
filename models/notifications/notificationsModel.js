const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  for: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  title: String,
  content: String,
  contentType: {
    type: String,
    enum: ['friend request accepted', 'friend request received', 'lesson', 'message', 'story', 'system'] // system = catch all, password change, report update, welcome
  },
  createdAt: Date,
  shouldClean: {
    type: Boolean,
    default: false,
  },
  cleanAt: Date,
},
{ // options
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;