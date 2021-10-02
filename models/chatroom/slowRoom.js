const mongoose = require('mongoose');
const Chatroom = require('./chatroomModel')

const slowModeRoomSchema = new mongoose.Schema({
    openableAt: Date,
  },
  { // options
    discriminatorKey: 'type',
  }
);

// slowModeRoomSchema.pre('save', function(next) {
//   const d = new Date();
//   const openableAt = d.setTime(d.getTime() + (1000 * 60 * 60 * 24))
//   this.openableAt = openableAt;
//   next();
// });

const SlowModeRoom = Chatroom.discriminator('SlowRoom', slowModeRoomSchema);

module.exports = SlowModeRoom;