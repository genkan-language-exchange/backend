// const SlowModeRoom = require('../models/slowModeRoomModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.sendMessage = catchAsync(async (req, res, next) => {

  res.status(200).json({
    status: 'success',
    data: {},
  });

});
