const mongoose = require('mongoose');
const User = require('./userModel');
const AppError = require('../utils/appError');

/*
****************
NOTES
****************
*/

/*
What:
Group for user shared interests.

Why:
Users can tag a story with a community.
Other users can find this story within the community view, as well as a list of other users in the community.

Want:
Prioritize high frequency community posters?
Allow users to create custom communities, but require admin approval.
*/

const communitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A community must have a name'],
  },
  image: String,
  active: {
    type: Boolean,
    default: false,
  },
  members: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    },
  ],
});

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;