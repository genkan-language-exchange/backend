const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');

const User = require('./models/userModel');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      // match user
      await User.findOne({ email }).select('+password')
        .then(async (user) => {
          if (!user) return done(null, false, { message: 'Email not registered' });
          
          // match password
          await user.passwordMatch(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) return done(null, user);
            else return done(null, false, { message: 'Bad password' })
          });
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