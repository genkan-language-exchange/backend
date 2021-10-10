const mongoose = require('mongoose');

const globalNotificationSchema = new mongoose.Schema({
  readBy: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  title: String,
  content: String,
  createdAt: Date,
  displayUntil: Date,
  status: {
    type: String,
    enum: ['deleted', 'draft', 'published'],
    default: 'published'
  }
},
{ // options
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const GlobalNotification = mongoose.model('GlobalNotification', globalNotificationSchema);

module.exports = GlobalNotification;