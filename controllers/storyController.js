const Story = require('../models/storyModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory')

exports.getStory = factory.getOne(Story, { path: 'userId' });
exports.getStories = factory.getAll(Story, { path: 'userId' });
exports.getDrafts = catchAsync(async (req, res) => {
  const { userId } = req.body;
});

/*******************
*******CREATE*******
*******************/

exports.createStory = catchAsync(async (req, res) => {
  const { userId, content, status } = req.body;

  const user = await User.findById(userId)
  if (!user) return next(new AppError("User not found", 404));

  user.matchSettings.lastSeen = Date.now();
  user.lastPosted = Date.now();

  await user.save({ validateBeforeSave: false });
  const newStory = await Story.create({
    userId,
    status,
    content,
    originalContent: content,
  });

  res.status(201).json({
    status: 'success',
    data: { newStory },
  });
});

exports.likeStory = catchAsync(async (req, res, next) => {
  const { userId, type } = req.body;
  const storyId = req.params.id;

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));

  const liked = story.likes.find(like => like.likeUser._id.toString() === userId);

  if (liked) {
    story.likes = story.likes.filter(like => like.likeUser._id.toString() !== userId);
  } else {
    story.likes.push({
      likeUser: userId,
      createdAt: Date.now(),
      likeType: type || 'heart'
    });
  }
  await story.save();

  res.status(200).json({
    status: 'success',
    data: { likes: story.likes },
  });
});

exports.reportStory = catchAsync(async (_req, res, _next) => {
  const { userId, reason } = req.body;
  const storyId = req.params.id;

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));

  if (story.report.reportDetails.find(report => report.reportedBy._id === userId))
    return next(new AppError("Already reported by user", 403));

  story.isReported = true,
  story.report.reportDetails.push({
    reportedReason: reason,
    reportedAt: Date.now(),
    reportedBy: userId
  });

  await story.save();

  res.status(200).json({
    status: 'success',
    data: {
      report: story.report
    }
  });
});

/*******************
*******UPDATE*******
*******************/

exports.editStory = catchAsync(async (req, res, next) => {
  const { userId, content } = req.body;
  const storyId = req.params.id;

  const user = await User.findById(userId).select('-originalContent');
  if (!user || user?.accountStatus === 'inactive') return next(new AppError("User not found", 404));
  if (user.accountStatus === 'banned') return next(new AppError("User is banned", 404));

  const story = await Story.findById(storyId);
  const storyUserId = story.userId.toString();
  
  if (storyUserId !== userId) return next(new AppError("This isn't yours", 403));

  story.content = content;
  const editedStory = await story.save();

  res.status(200).json({
    status: 'success',
    data: { editedStory },
  });
});

/*******************
*******DELETE*******
*******************/

exports.deleteStory = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  const storyId = req.params.id;

  const user = await User.findById(userId);
  if (!user || user?.accountStatus === 'inactive') return next(new AppError("User not found", 404));
  if (user.accountStatus === 'banned') return next(new AppError("User is banned", 404));

  const story = await Story.findById(storyId)
  const storyUserId = story.userId.toString();

  if (storyUserId !== userId) return next(new AppError("This isn't yours", 403));

  story.status = 'deleted';
  const deletedStory = await story.save;

  res.status(204).json({
    status: 'success',
    data: { deletedStory }
  });
});

exports.adminDeleteStory = catchAsync(async (req, res) => {
  const storyId = req.params.id;
  const deletedStory = await Story.findByIdAndDelete(storyId);

  res.status(204).json({
    status: 'success',
    data: { deletedStory }
  });
});

/*******************
******COMMENT*******
*******************/

exports.createComment = catchAsync(async (req, res, next) => {
  const { userId, content } = req.body;
  const storyId = req.params.id;

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));

  story.comments.push({
    commenter: userId,
    content,
    createdAt: Date.now()
  })

  await story.save()

  res.status(200).json({
    status: 'success',
    data: { comments: story.comments }
  });
});

exports.editComment = catchAsync(async (req, res, next) => {
  const { userId, commentId, content } = req.body;
  const storyId = req.params.id;
  if (!content) return next(new AppError("Missing body", 400));

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));

  const commentExists = story.comments.find(comment => comment._id.toString() === commentId);
  if (!commentExists || !commentExists.visible) return next(new AppError("Comment not found", 404));
  const commentUser = commentExists.commenter;
  
  if (commentUser._id.toString() !== userId) return next(new AppError("This isn't yours", 403));

  if (!commentExists.edited) commentExists.originalContent = content;
  commentExists.edited = true
  commentExists.content = content;
  
  await story.save();

  res.status(200).json({
    status: 'success',
    data: { comments: story.comments }
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { userId, commentId } = req.body;
  const storyId = req.params.id;

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));

  const commentExists = story.comments.find(comment => comment._id.toString() === commentId);
  if (!commentExists || !commentExists.visible) return next(new AppError("Comment not found", 404));
  
  const commentUser = commentExists.commenter;
  if (commentUser._id.toString() !== userId) return next(new AppError("This isn't yours", 403));

  commentExists.visible = false;

  await story.save();

  res.status(204).json({
    status: 'success',
    data: { comments: story.comments }
  });
});

exports.adminDeleteComment = catchAsync(async (req, res) => {
  const { commentId } = req.body;
  const storyId = req.params.id;

  const story = await Story.findById(storyId);
  story.comments = story.comments.filter(comment => comment._id.toString() !== commentId);
  await story.save();

  res.status(204).json({
    status: 'success',
    data: { comments: story.comments }
  });
});