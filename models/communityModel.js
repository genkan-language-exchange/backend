const mongoose = require('mongoose');

/*
****************
NOTES
****************
*/

/*
What:
Group for user shared interests (from specific anime/video game titles to general hobbies)

Why:
Users can tag a story with a community.
Other users can find this story within the community view, as well as a list of other users in the community.

Want:
Prioritize high frequency community posters?
Allow users to create custom communities, but require admin approval.
*/

const communitySchema = new mongoose.Schema({
  communityName: {
    type: String,
    required: true,
    unique: true,
  },
  tags: [
    {
      type: String,
      validate: {
        validator: function(val) {
          return this.tags.contains(val)
        },
        message: "This community already has that tag",
      }
    }
  ],
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