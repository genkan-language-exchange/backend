const Room = require('../models/roomModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.sendMessage = catchAsync(async (req, res, next) => {
  const roomId = req.params.roomId;  
  const { message, userFrom } = req.body;

  const existingRoom = await Room.findById(roomId);

  if (!existingRoom) return new AppError('Room not found', 404);
  if (existingRoom.messagePermission.status === 'pending' || existingRoom.messagePermission.status === 'blocked') return new AppError('Error finding room', 400);

  const newMessage = {
    from: userFrom,
    message,
  }

  const updatedRoom = await Room.findByIdAndUpdate(roomId, { messages: newMessage });

  res.status(200).json({
    status: 'success',
    data: {
      updatedRoom,
    },
  });

});
