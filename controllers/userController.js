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
  console.log(req.body)

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

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.getPotentialPartners = catchAsync(async(req, res) => {
  let { language, minLevel = 0, matchAny = false, page = 1, limit = 25, partnerType = 'learn' } = req.query
  
  if (language == undefined) matchAny = true
  
  let filter
  if (partnerType === 'learn') {
    filter = [
      { $and: [{ 'matchSettings.languageKnow1': { $eq: language }}, { 'matchSettings.languageKnow1Level': { $gte: minLevel }},] },
      { $and: [{ 'matchSettings.languageKnow2': { $eq: language }}, { 'matchSettings.languageKnow2Level': { $gte: minLevel }},] },
      { $and: [{ 'matchSettings.languageKnow3': { $eq: language }}, { 'matchSettings.languageKnow3Level': { $gte: minLevel }},] },
    ]
  } else if (partnerType === 'teach') {
    filter = [
      { $and: [{ 'matchSettings.languageLearn1': { $eq: language }}, { 'matchSettings.languageLearn1Level': { $gte: minLevel }},] },
      { $and: [{ 'matchSettings.languageLearn2': { $eq: language }}, { 'matchSettings.languageLearn2Level': { $gte: minLevel }},] },
      { $and: [{ 'matchSettings.languageLearn3': { $eq: language }}, { 'matchSettings.languageLearn3Level': { $gte: minLevel }},] },
    ]
  }
  filter.unshift({ 'filterSettings.matchAny': { $eq: matchAny } })

  try {
    const userDocs = await User.aggregate([
      {
        $match: {
          $and: [
            { _id: { $ne: req.user._id }},
            { active: { $eq: true } },
            { accountStatus: { $eq: 'verified' } },
            { 'matchSettings.age': { $gte: req.user.filterSettings.allowMatchAges[0] } }, // min 18
            { 'matchSettings.age': { $lte: req.user.filterSettings.allowMatchAges[1] } }, // max 150
            { 'matchSettings.gender': { $in: req.user.filterSettings.allowMatchGenders } }, // doc matches user's own gender preferences
            { 'filterSettings.allowMatchGenders': { $elemMatch: { $eq: req.user.matchSettings.gender } } }, // user's gender matches doc's preferences
            // TODO: country preferences
          ],
          $or: filter
        },
      },
      {
        $unset: ['filterSettings','profile','accountStatus','email','password','passwordChangedAt','matchSettings.birthday']
      },
      {
        $sort: { 'matchSettings.lastSeen': -1 },
      },
      {
        $facet: {
          metadata: [ { $count: "total" }, { $addFields: { page } } ],
          data: [ { $skip: (page - 1) * limit }, { $limit: parseInt(limit) } ]
        }
      },
    ])
  
    res.status(200).json({
      status: 'success',
      results: userDocs[0].metadata[0]?.total || 0,
      data: userDocs[0].data
    })
    
  } catch (err) {
    console.log(err)
    res.status(500)
  }
})

// exports.aliasGetAllUsers = catchAsync(async (req, _, next) => {
//   req.query = {
//     ...req.query,
//     $and: [
//       { _id: { $ne: req.user._id }},
//       { accountStatus: { $eq: "verified" }},
//     ],
//     limit: '25',
//     sort: '-matchSettings.lastSeen',
//     fields: 'name,identifier,matchSettings,role,gravatar'
//   }
//   next();
// });

// exports.aliasGetNew = catchAsync(async (req, _, next) => {
//   const threeDays = 1000 * 60 * 60 * 24 * 3
//   const threeDaysAgo = new Date(Date.now() - threeDays)
  
//   req.query = {
//     ...req.query,  
//     "matchSettings.accountCreated": { gte: threeDaysAgo },
//     sort: '-matchSettings.accountCreated',
//   }
//   next();
// });

// exports.aliasGetOnline = catchAsync(async (req, _, next) => {
//   const thirtyMinutes = 1000 * 60 * 30
//   const halfHourAgo = new Date(Date.now() - thirtyMinutes)

//   req.query = {
//     ...req.query,
//     "matchSettings.lastSeen": { gte: halfHourAgo },
//     sort: '-matchSettings.lastSeen',
//   }
//   next();
// });

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
