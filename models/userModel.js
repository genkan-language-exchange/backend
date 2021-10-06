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
  avatar: String,
  gravatar: String,
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
    about: String,
    interests: Array,
  },
  matchSettings: { // user's own information
    accountCreated: Date, // user can block new accounts made within up to 1 month from sending message
    lastSeen: Date,
    age: {
      type: Number,
      min: 16,  // allow 16 but only show to under 18
      max: 150,
    },
    birthday: Date, // for age verification
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary'],
    },
    nationality: String,
    residence: String,
    languageKnow1: String,
    languageKnow2: String,
    languageKnow3: String,
    languageKnow1Level: {
      type: Number,
      min: 0,
      max: 3,
    },
    languageKnow2Level: {
      type: Number,
      min: 0,
      max: 3,
    },
    languageKnow3Level: {
      type: Number,
      min: 0,
      max: 3,
    },
    languageLearn1: String,
    languageLearn2: String,
    languageLearn3: String,
    languageLearn1Level: {
      type: Number,
      min: 0,
      max: 3,
    },
    languageLearn2Level: {
      type: Number,
      min: 0,
      max: 3,
    },
    languageLearn3Level: {
      type: Number,
      min: 0,
      max: 3,
    },
  },
  filterSettings: { // the type of study partner the user wants to find
    allowMatchAges: {
      type: Array,
      default: [18, 150],
      min: 16,
      max: 150,
    },
    allowMatchGenders: { // user can block genders
      type: Array,
      default: ['male', 'female', 'non-binary'],
    },
    allowMatchNationalities: Array,
    allowMatchResides: Array, // user can block people in same country as them
    matchAny: {
      type: Boolean,
      default: true,
    },
    showOwnAge: {
      type: Boolean,
      default: true,
    },
    showOwnIdentifier: {
      type: Boolean,
      default: false,
    },
    showOnlineStatus: {
      type: Boolean,
      default: true,
    },
    blurUntilMatch: {
      type: Boolean,
      default: true,
    }
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