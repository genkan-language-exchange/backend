const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const filterBody = (obj, ...allowedFields) => {

  const newObj = {};

  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];    
  });

  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    },
  });
});

exports.updateMe = async (req, res, next) => {
  // 1) create error if user POSTs password ata
  if (req.body.password || req.body.passwordConfirm) return next(new AppError('Wrong route for password updating', 400));

  // 2) clean the request
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) prepare options
  const options = {
    new: true,
    runValidators: true,
  };

  // 4) update user doc
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, options);

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    }
  });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
