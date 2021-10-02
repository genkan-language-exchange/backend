const gravatar = require('gravatar')
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory');

const filterBody = (obj, ...allowedFields) => {

  const newObj = {};

  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];    
  });

  return newObj;
};

exports.ping = catchAsync(async (req, res) => {
  console.log("PING")
  const user = req.user;
  user.matchSettings.lastSeen = Date.now();
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true });
});

exports.getUser = catchAsync(async (req, res, next) => {
  let user;
  if (req.params.id) {
    user = await User.findById(req.params.id).select('-__v -password');
  } else if (req.query.self) {
    // return a fresh copy of own document
    user = await User.findById(req.user._id).select('-__v -password -email');
    // user = req.user
  } else {
    const filter = {
      name: req.body.name,
      identifier: req.body.identifier
    };
    user = await User.find(filter).select('-__v -password');
  }
  
  if (!user || user?.accountStatus === 'inactive') return next(new AppError('User not found', 404));
  if (user.accountStatus === 'banned') return next(new AppError('User is banned', 404));

  let gUrl = ""
  if (!req.query.self) {
    gUrl = gravatar.url(user[0].email)
    user[0].email = undefined
  } else {
    gUrl = gravatar.url(user.email)
    user.email = undefined
  }

  res.status(200).json({
    status: 'success',
    data: user,
    gravatar: gUrl,
  });
});

exports.getAllUsers = factory.getAll(User)

exports.aliasGetAllUsers = catchAsync(async (req, _, next) => {
  req.query = {
    ...req.query,
    $and: [
      { _id: { $ne: req.user._id }},
      { accountStatus: { $eq: "verified" }},
    ],
    limit: '25',
    sort: '-matchSettings.lastSeen',
    fields: 'name,identifier,matchSettings,role'
  }
  next();
});

exports.aliasGetNew = catchAsync(async (req, _, next) => {
  const threeDays = 1000 * 60 * 60 * 24 * 3
  const threeDaysAgo = new Date(Date.now() - threeDays)
  
  req.query = {
    ...req.query,
    $and: [
      { _id: { $ne: req.user._id }},
      { accountStatus: { $eq: "verified" } },
      { "matchSettings.accountCreated": { gte: threeDaysAgo } }
    ],
    limit: '25',
    sort: '-matchSettings.accountCreated',
    fields: 'name,identifier,matchSettings,role'
  }
  next();
});

exports.aliasGetOnline = catchAsync(async (req, _, next) => {
  const thirtyMinutes = 1000 * 60 * 30
  const halfHourAgo = new Date(Date.now() - thirtyMinutes)

  req.query = {
    ...req.query,
    $and: [
      { _id: { $ne: req.user._id }},
      { accountStatus: { $eq: "verified" } },
      { "matchSettings.lastSeen": { gte: halfHourAgo } }
    ],
    limit: '25',
    sort: '-matchSettings.lastSeen',
    fields: 'name,identifier,matchSettings,role'
  }
  next();
});

exports.updateMe = async (req, res, next) => {
  // 1) create error if user POSTs password
  if (req.body.password || req.body.passwordConfirm) return next(new AppError('Wrong route for password updating', 400));

  // 2) clean the request
  const filteredMatch = filterBody(req.body.matchSettings, 'languageKnow', 'languageLearn', 'residence');
  const filteredFilters = filterBody(req.body.filterSettings,
    'showOwnIdentifier',
    'showOwnAge',
    'showOnlineStatus',
    'blurUntilMatch',
    'ages',
    'genders',
    'nationalities',
    'resides',
    'languagesKnow',
    'languagesLearn'
  )

  const filteredBody = {
    ...filteredMatch,
    ...filteredFilters,
  }

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

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    setInactiveDate: Date.now(),
    accountStatus: 'inactive',
    active: false,
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.reviveMe = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const isValidUser = await User.findById(userId);
  if (!isValidUser.length) return new AppError('User not found', 404);
  if (isValidUser.accountStatus === 'banned') return new AppError(`User account is ${status}`, 400);
  
  const user = await User.findByIdAndUpdate(userId, {
    setInactiveDate: undefined,
    active: true,
  });

  res.status(200).json({
    status: 'success',
    data: user,
  });
})

/* ADMIN ONLY */
// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
