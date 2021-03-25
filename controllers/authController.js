const crypto = require('crypto');
const moment = require('moment');
const passport = require('passport');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const getIdentifier = require('../utils/identifier');

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;

  // check for existing email
  const userExists = await User.find({ email });
  if (userExists.length > 0) return next(new AppError('Pre-existing user found', 400));

  // check for available 4 digit identifying number
  const usersByName = await User.find({ name });
  let usedIdentifiers = [];
  for (let user of usersByName)
    usedIdentifiers.push(user.identifier);
  let identifier;

  try {
    identifier = getIdentifier(usedIdentifiers);
  } catch (error) {
    return next(new AppError(error, 400));
  }

  // create validation token
  const token = crypto.randomBytes(32).toString('hex');
  const validationToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // set user age
  const age = moment(req.body.matchSettings.birthday, 'YYYYMMDD').fromNow();
  req.body.matchSettings.age = age.split(' ')[0];

  // create the user
  const newUser = await User.create({
    name,
    email,
    identifier,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    matchSettings: req.body.matchSettings,
    validationToken,
    validationExpires: Date.now() + (30 * 60 * 1000),
    sid: req.sessionID,
  });

  if (!newUser) return next(new AppError('Could not create user', 500));

  // send account validation email
  const validationURL = `${req.protocol}://${req.get('host')}/api/v1/users/validation/${validationToken}`;

  const message = `Click this link to finalise the creation of your account: ${validationURL}\n You can ignore this email if you did not create an account with us.`;

  try {
    await sendEmail({
      email,
      subject: 'Confirm Your Genkan Account!',
      text: message,
    });
  
    res.status(201).json({
      status: 'success',
      data: {
        newUser,
      },
    });
  } catch (err) {
    newUser.validationToken = undefined;
    newUser.validationExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(new AppError('Could not send verification email', 500));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email & password exist
  if (!email || !password) {
    return next(new AppError('Be sure to provide both an email and password', 400));
  }

  // check if user exists
  const user = await User.findOne({ email }).select('+sid');

  if (!user) return res.status(401).json({
    status: "fail",
    message: "User not found"
  });

  user.sid = req.sessionID;
  user.matchSettings.lastSeen = Date.now();

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ sid: req.sessionID }).select('+sid');
  if (!user) return next(new AppError('Already logged out', 404));
  
  user.sid = undefined;
  await user.save({ validateBeforeSave: false });

  req.logout();
  req.session.destroy(err => {
    if (err) return next(new AppError('Unable to log out at this time', 500));
    res.clearCookie();
    res.status(204).send();
  });
});

exports.protect = catchAsync(async (req, _, next) => {
  console.log('sid: ' + req.sessionID);
  console.log('passport user: ');
  console.log(req);
  const user = await User.find({ sid: req.sessionID }).select('+sid');

  if (!user[0] || user[0] == undefined) return next(new AppError('You have been logged out, please log in again', 403));

  user.matchSettings.lastSeen = Date.now();
  await user.save({ validateBeforeSave: false });
  req.user = user[0];
  next();
});

exports.restrictTo = (...roles) => {
  // roles ['user', 'vip', 'admin']
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) return next(new AppError('User does not have permission to do that', 403));
    next();
  }
}

/*
  ********************
  PASSWORD UPDATING
  ********************
*/

exports.forgottenPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('User not found', 404));

  // 2) generate a random reset token
  const resetToken = user.createPasswordResetToken();
  // save token and token expiration to user
  // disable MongoDB validators so we can save without a password
  await user.save({ validateBeforeSave: false });

  // 3) send email with token to user
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and confirmation password to: ${resetURL}\n You can ignore this email if you did not forget your password or if you remembered it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request (valid for 30 minutes!)',
      text: message,
    });
  
    res.status(200).json({
      status: 'success',
      message: 'Request sent successfully'
    })
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Could not send password reset email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    passwordResetToken: req.params.token,
    passwordResetExpires: {$gt: Date.now()}
  });

  // 2) if token is fresh and user exists, set new password
  if (!user) return next(new AppError('Bad Token', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  res.status(200).json({
    message: 'success',
    data: null,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collections
  const user = await User.findById(req.user._id).select('+password');

  // 2) check if posted password is correct
  if (!user || !await user.passwordMatch(req.body.passwordCurrent, user.password)) return next(new AppError('Check your credentials', 401));

  // 3) if correct, update password
  user.password = req.body.passwordNew;
  user.passwordConfirm = req.body.passwordNewConfirm;
  await user.save();
  
  res.status(200).json({
    message: 'success',
    data: null,
  });
});

/*
  ********************
  ACCOUNT VERIFICATION
  ********************
*/

exports.resendValidationEmail = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('User not found', 404));

  if (user.accountStatus === 'verified') return next(new AppError('User already verified', 403));

  // 2) generate a random validation token
  const validationToken = user.createValidationToken();
  // save token and token expiration to user
  await user.save({ validateBeforeSave: false });

  // 3) send email with token to user
  const validationURL = `${req.protocol}://${req.get('host')}/api/v1/users/validation/${validationToken}`;

  const message = `Click this link to finalise the creation of your account: ${validationURL}\n You can ignore this email if you did not create an account with us.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Confirm Your Genkan Account!',
      text: message,
    });
  
    res.status(200).json({
      status: 'success',
      message: 'Request sent successfully'
    })
  } catch (err) {
    user.validationToken = undefined;
    user.validationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Could not send verification email', 500));
  }
});

exports.verifyAccount = catchAsync(async (req, res, next) => {
  // 1) get user from token 
  const user = await User.findOne({
    validationToken: req.params.token,
    validationExpires: { $gt: Date.now() }
  });

  // 2) check user status
  if (!user) return next(new AppError('User not found', 404));
  if (user.accountStatus != 'pending') return next(new AppError('User already verified', 403));

  // 3) verify user if ok
  user.accountStatus = 'verified';
  user.validationToken = undefined;
  user.validationExpires = undefined;
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({
    message: 'success',
    data: null,
  });
});