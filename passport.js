const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const AppError = require('./utils/appError');
const User = require('./models/userModel');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      // match user
      await User.findOne({ email }).select('+password')
        .then(async (user) => {
          if (!user) return done(new AppError('Email not registered', 401), false);
          
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return new AppError('Something went wrong validating the password', 500);
            if (isMatch) return done(null, user);
            return done(new AppError('Bad password', 401), false);
          }
        );
      })
        .catch(err => console.error(err))
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
}