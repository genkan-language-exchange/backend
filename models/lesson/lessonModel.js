const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Draft lesson',
  },
  language: String,
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  widgets: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Widget',
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'published', 'private', 'deleted'],
    default: 'draft',
  },
  createdAt: Date, // should be set the first time it's published
  updatedAt: Date,
})

lessonSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

lessonSchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'teacher',
      select: '_id name identifier matchSettings accountStatus active role'
    },
    {
      path: 'widgets',
    },
  ]);
  next();
});

const Lesson = mongoose.model('Lesson', lessonSchema)

module.exports = Lesson