const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { data: doc },
  });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  
  if (!doc) {
    return next(new AppError(`No resource found for id ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: { data: doc },
  });
});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError(`No resource found for id ${req.params.id}`, 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  }); 
});
