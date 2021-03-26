const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    lowercase: true,
    maxlength: 20,
  },
  email: {
    type: String,
    required: [true, 'Email address required for account validation'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  identifier: {
    type: String,
  },
  photo: String,
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    minlength: 8,
    validate: {
      validator: function(value) {
        return value === this.password;
      },
      message: 'Passwords do not match'
    },
  },
  active: {
    type: Boolean,
    default: true,
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'verified', 'banned'],
    default: 'pending',
  },
  role: {
    type: String,
    enum: ['user', 'vip', 'admin', 'owner'],
    default: 'user',
  },
  profile: {
    about: {
      type: String,
    },
    interests: {
      type: Array,
    },
    languageGoal: {
      type: String,
    },
  },
  matchSettings: {
    accountCreated: { // user can block new accounts made within up to 1 month from sending message
      type: Date,
      default: Date.now(),
    },
    lastSeen: {
      type: Date,
      default: Date.now(),
    },
    age: Number, // allow 16 but only show to under 18
    birthday: Date, // for age verification
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary'],
    },
    allowedGenders: { // user can block genders
      type: Array,
      default: ['male', 'female', 'non-binary'],
    },
    nationality: String,
    residence: String,
    languageKnow: Array,
    languageLearn: Array,
  },
  filterSettings: {
    ages: {
      type: Array,
      default: [18, 100],
      min: 18,
    },
    genders: {
      type: Array,
      default: ['male', 'female', 'non-binary']
    },
    nationalities: Array,
    resides: Array, // user can block people in same country as them
    languagesKnow: Array, // user can block anyone who doesn't know their target language
    languagesLearn: Array, // in the interest of allowing pure cultural exchange this can be empty
  },
  accountNotes: { // allow admin to add notes to account
    type: String,
  },
  report: {
    isReported: {
      type: Boolean,
      default: false,
    },
    reportedReason: String,
    reportedAt: Date,
  },
  setInactiveDate: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  validationToken: String,
  validationExpires: Date,
});

// MIDDLEWARE

userSchema.pre('save', async function(next) {
  // only run if password was modified
  if (!this.isModified('password')) return next();

  // hash password 12 rounds
  this.password = await bcrypt.hash(this.password, 12);

  // remove password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.accountStatus === 'pending') return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// INTERWARE

userSchema.methods.passwordMatch = async function(userSubmittedPassword, userPassword) {
  return await bcrypt.compare(userSubmittedPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // save hashed token to user to compare against later
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // set token valid period to 30 minutes
  this.passwordResetExpires = Date.now() + (30 * 60 * 1000);

  // return plain text token to be sent through email
  return resetToken;
}

userSchema.methods.createValidationToken = function() {
  const validationToken = crypto.randomBytes(32).toString('hex');

  // save hashed token to user to compare against later
  this.validationToken = crypto
    .createHash('sha256')
    .update(validationToken)
    .digest('hex');

  // set valid period to 30 minutes
  this.validationExpires = Date.now() + (30 * 60 * 1000);

  // return plain text token to be sent through email
  return validationToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;