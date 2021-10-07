const Story = require('../models/storyModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory')

exports.getStory = factory.getOne(Story, { path: 'userId' });
exports.getStories = factory.getAll(Story, { path: 'userId' });

exports.getPublished = (req, _, next) => {
  req.query = {
    ...req.query,
    status: { $eq: "visible" },
    limit: '25',
    sort: '-createdAt',
    fields: '-status -report'
  };
  next();
};

exports.getUserStories = (req, _, next) => {
  const userId = req.body._id
  req.query = {
    ...req.query,
    $and: [
      {status: { $eq: "visible" } },
      {userId: { $eq: userId } }
    ],
    limit: '25',
    sort: '-createdAt',
    fields: '-status -report',
  };
  next();
};

exports.getDrafts = (req, _, next) => {
  const userId = req.user._id
  req.query = {
    ...req.query,
    $and: [
      {status: { $eq: "draft" } },
      {userId: { $eq: userId } }
    ],
    limit: '25',
    sort: '-createdAt',
    fields: '-status -report',    
  };
  next();
};


/*******************
*******CREATE*******
*******************/

exports.createStory = catchAsync(async (req, res) => {
  const { content, status, _id } = req.body;
  const userId = req.user._id;
  
  let newStory;
  if (_id != null) {
    const existingDraft = await Story.findById(_id);
    if (existingDraft) {
      existingDraft.content = content;
      existingDraft.originalContent = content;
      existingDraft.status = status;
      existingDraft.createdAt = Date.now();

      newStory = await existingDraft.save();
      res.status(200).json({
        status: 'success',
        data: newStory
      }).end();
      return;
    };
  };

  const subscribed = []
  subscribed.push(userId)
  
  newStory = await Story.create({
    userId,
    status,
    content,
    originalContent: content,
    subscribed,
    createdAt: Date.now()
  });

  res.status(201).json({
    status: 'success',
    data: newStory,
  });
});

exports.likeStory = catchAsync(async (req, res, next) => {
  const { type } = req.body;
  const storyId = req.params.id;
  const userId = req.user._id.toString();

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));
  if (story.userId._id.toString() === req.user._id.toString()) return next(new AppError("Cannot like own story", 400));

  const liked = story.likes.filter(like => like.likeUser != null || like.likeUser != undefined).find(like => like.likeUser._id.toString() === userId);

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

  const likes = story.likes;

  res.status(200).json({
    status: 'success',
    data: likes,
  });
});

exports.reportStory = catchAsync(async (_req, res, _next) => {
  const { reason } = req.body;
  const storyId = req.params.id;
  const userId = req.user._id.toString();

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));

  if (story.report.reportDetails.find(report => report.reportedBy._id.toString() === userId))
    return next(new AppError("Already reported by user", 403));

  story.isReported = true,
  story.report.reportDetails.push({
    reportedReason: reason,
    reportedAt: Date.now(),
    reportedBy: userId
  });

  await story.save();

  const report = story.report

  res.status(200).json({
    status: 'success',
    data: report
  });
});

/*******************
*******UPDATE*******
*******************/

exports.editStory = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const storyId = req.params.id;

  const userId = req.user._id.toString();

  const story = await Story.findById(storyId);
  const storyUserId = story.userId._id.toString();
  
  if (storyUserId !== userId) return next(new AppError("This isn't yours", 403));

  story.content = content;
  const editedStory = await story.save();

  res.status(200).json({
    status: 'success',
    data: editedStory,
  });
});

/*******************
*******DELETE*******
*******************/

exports.deleteStory = catchAsync(async (req, res, next) => {
  const storyId = req.params.id;

  const userId = req.user._id.toString();

  const story = await Story.findById(storyId)
  const storyUserId = story.userId._id.toString();

  if (storyUserId !== userId) return next(new AppError("This isn't yours", 403));

  story.status = 'deleted';
  await story.save();

  res.status(204).json({
    status: 'success'
  });
});

exports.adminDeleteStory = catchAsync(async (req, res) => {
  const storyId = req.params.id;
  const deletedStory = await Story.findByIdAndDelete(storyId);

  res.status(204).json({
    status: 'success',
    data: deletedStory
  });
});

/*******************
******COMMENT*******
*******************/

exports.createComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const storyId = req.params.id;

  const userId = req.user._id;

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));

  story.comments.push({
    commenter: userId,
    content,
    createdAt: Date.now()
  })

  await story.save()

  const comments = story.comments
  
  res.status(200).json({
    status: 'success',
    data: comments,
  });
});

exports.editComment = catchAsync(async (req, res, next) => {
  const { commentId, content } = req.body;
  const storyId = req.params.id;
  const userId = req.user._id.toString();
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
  const comments = story.comments

  res.status(200).json({
    status: 'success',
    data: comments
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.body;
  const storyId = req.params.id;
  const userId = req.user._id.toString();

  const story = await Story.findById(storyId);
  if (!story) return next(new AppError("Story not found", 404));

  const commentExists = story.comments.find(comment => comment._id.toString() === commentId);
  if (!commentExists || !commentExists.visible) return next(new AppError("Comment not found", 404));
  
  const commentUser = commentExists.commenter;
  if (commentUser._id.toString() !== userId) return next(new AppError("This isn't yours", 403));

  commentExists.visible = false;

  await story.save();
  const comments = story.comments

  res.status(204).json({
    status: 'success',
    data: comments
  });
});

exports.adminDeleteComment = catchAsync(async (req, res) => {
  const { commentId } = req.body;
  const storyId = req.params.id;

  const story = await Story.findById(storyId);
  story.comments = story.comments.filter(comment => comment._id.toString() !== commentId);
  await story.save();
  const comments = story.comments

  res.status(204).json({
    status: 'success',
    data: comments
  });
});

exports.adminDeletedRemoved = catchAsync(async (_, res) => {
  await Story.deleteMany({ "status": "deleted" })
  res.status(204).json({
    status: "success"
  });
});
