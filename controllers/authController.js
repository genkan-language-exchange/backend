const { promisify } = require('util');
const crypto = require('crypto');
const moment = require('moment');
const jwt = require('jsonwebtoken');

const sendEmail = require('../utils/email');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const getIdentifier = require('../utils/identifier');
const User = require('../models/userModel');

const createSendToken = (user, statusCode, res) => {
  const token = genToken(user._id);

  const cookieExpiresIn = process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000;

  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpiresIn),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
}

function genToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
};

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
  });

  // send account validation email
  // const validationURL = `${req.protocol}://${req.get('host')}/api/v1/users/validation/${validationToken}`;
  const validationURL = `https://genkan.app/verify/${validationToken}`;

  const message = `Click this link to finalise the creation of your account: ${validationURL}\n You can ignore this email if you did not create an account with us.`;

  try {
    await sendEmail({
      email,
      subject: 'Confirm Your Genkan Account!',
      text: message,
    });
  } catch (err) {
    newUser.validationToken = undefined;
    newUser.validationExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(new AppError('Could not send verification email', 500));
  }

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email & password exist
  if (!email || !password) {
    return next(new AppError('Be sure to provide both an email and password', 400));
  }

  // check if user exists
  const user = await User.findOne({ email }).select('+password');

  // check password
  if (!user || !(await user.passwordMatch(password, user.password))) {
    return next(new AppError('Be sure to provide both an email and password', 400));
  }

  if (!user) return res.status(400).json({
    status: "fail",
    message: 'Be sure to provide both an email and password'
  });

  user.matchSettings.lastSeen = Date.now();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (_, res) => {
  res.status(204).send()
});

exports.protect = catchAsync(async (req, _, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  currentUser.matchSettings.lastSeen = Date.now()
  await currentUser.save({ validateBeforeSave: false })
  // GRANT ACCESS TO PROTECTED ROUTE

  req.user = currentUser;
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
  const resetURL = `https://genkan.app/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and confirmation password to: ${resetURL}\nYou can ignore this email if you did not forget your password.`;

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

  await user.save({ validateBeforeSave: false });

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
  // const validationURL = `${req.protocol}://${req.get('host')}/api/v1/users/validation/${validationToken}`;
  const validationURL = `https://genkan.app/verify/${validationToken}`;

  const message = `Click this link to finalize the creation of your account: ${validationURL}\nYou can ignore this email if you did not create an account with us.`;

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