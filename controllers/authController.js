const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    matchSettings: req.body.matchSettings,
    sid: req.sessionID, // TODO: add this on email confirmation
  })

  if (!newUser) return next(new AppError('Could not create user', 500));

  res.status(201).json({
    status: 'success',
    data: {
      newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email & password exist
  if (!email || !password) {
    return next(new AppError('Be sure to provide both an email and password', 400));
  }

  // check if user exists
  const user = await User.findOne({ email }).select('+password +sid');

  if (!user) return next(new AppError('Check your credentials', 401));

  user.sid = req.sessionID;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ sid: req.sessionID }).select('+password +sid');
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

exports.protect = catchAsync(async (req, res, next) => {
  if (!req.isAuthenticated()) return next(new AppError('You have been logged out, please log in again', 403));
  next();
});

exports.restrictTo = (...roles) => {
  // roles ['admin']
  return (req, res, next) => {
    // req.user.roles is available when we use the protect middleware before this one
    if (!roles.includes(req.user.roles)) {
      return next(new AppError('User does not have permission to do that', 403));
    }
    next();
  }
}

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
  // 1) get user from token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {$gt: Date.now()}
  });

  // 2) if token is fresh and user exists, set new password
  if (!user) return next(new AppError('Bad Token', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) update passwordCreatedAt property for user
  // happens in middleware on user model

  // 4) log the user in (send new JWT)
  createSendToken(user, 200, res);
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

  // 4) send a new JWT
  createSendToken(user, 200, res);
});

exports.confirmAccountCreation = catchAsync(async (req, res, next) => { // TODO
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

  const message = `Click this link to finalise the creation of your account: ${resetURL}\n You can ignore this email if you did not create an account with us.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request (valid for 60 minutes!)',
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