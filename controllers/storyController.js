const Story = require('../models/storyModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory')

exports.getStory = factory.getOne(Story, { path: 'userId' });
exports.getStories = factory.getAll(Story, { path: 'userId' });

exports.createStory = catchAsync(async (req, res, next) => {
  const { userId, content } = req.body;

  const user = await User.findById(userId);
  if (!user || user?.accountStatus === 'inactive') return next(new AppError('User not found', 404));
  if (user.accountStatus === 'banned') return next(new AppError('User is banned', 404));

  const newStory = await Story.create({
    userId,
    content,
    originalContent: content,
  });

  res.status(201).json({
    status: 'success',
    data: { newStory },
  });
});

exports.editStory = catchAsync(async (req, res, next) => {
  const { userId, content } = req.body;
  const storyId = req.params.id;

  const user = await User.findById(userId).select('-originalContent');
  if (!user || user?.accountStatus === 'inactive') return next(new AppError("User not found", 404));
  if (user.accountStatus === 'banned') return next(new AppError("User is banned", 404));

  const story = await Story.findById(storyId);
  const storyUserId = story.userId.toString();
  
  if ((storyUserId !== userId) || (storyUserId !== userId && (user.role !== 'admin' || user.role !== 'owner'))) return next(new AppError("This isn't yours", 403));

  story.content = content;
  const editedStory = await story.save();

  res.status(201).json({
    status: 'success',
    data: { editedStory },
  });
});

exports.deleteStory = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  const storyId = req.params.id;

  const user = await User.findById(userId);
  if (!user || user?.accountStatus === 'inactive') return next(new AppError("User not found", 404));
  if (user.accountStatus === 'banned') return next(new AppError("User is banned", 404));

  const story = await Story.findById(storyId)
  const storyUserId = story.userId.toString();

  if (
    (storyUserId !== userId) ||
    (storyUserId !== userId && (user.role !== 'admin' || user.role !== 'owner')))
      return next(new AppError("This isn't yours", 403));

  story.status = 'deleted';
  const deletedStory = await story.save;

  res.status(204).json({
    status: 'success',
    data: { deletedStory }
  });
});

exports.adminDeleteStory = catchAsync(async (req, res, next) => {
  const storyId = req.params.id;

  if (storyUserId !== userId && (user.role !== 'admin' || user.role !== 'owner')) return next(new AppError("You lack sufficient permissions to perform this action", 403));

  const deletedStory = await Story.findByIdAndDelete(storyId);

  res.status(204).json({
    status: 'success',
    data: { deletedStory }
  });
});
