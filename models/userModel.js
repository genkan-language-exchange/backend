const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 999,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    minlength: 8,
    maxlength: 999,
    validate: {
      // this only runs on CREATE and SAVE, not update
      validator: function(value) {
        return value === this.password;
      },
      message: 'Passwords do not match'
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  sid: String,
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
  if (!this.isModified('password') || this.isNew) return next();

  // saving might be slower than a new token can be issued, so set time to be 1 second sooner
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // only return documents with 'active' not equal to false
  this.find({ active: { $ne: false } });
  next();
});

// INTERWARE

userSchema.methods.passwordMatch = async function(userSubmittedPassword, userPassword) {
  return await bcrypt.compare(userSubmittedPassword, userPassword);
};

userSchema.methods.didPasswordChange = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000
      );
      
      // return false for good fortune
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

const User = mongoose.model('User', userSchema);

module.exports = User;