const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./factory')
const filterBody = require('../utils/filterBody')

const Lesson = require('../models/lesson/lessonModel')
const Widget = require('../models/lesson/widgets/widgetModel')
const TableWidget = require('../models/lesson/widgets/tableWidget')
const TextWidget = require('../models/lesson/widgets/textWidget')
const TitleWidget = require('../models/lesson/widgets/titleWidget')
const TranslationWidget = require('../models/lesson/widgets/translationWidget')

exports.getPublished = (req, _, next) => {
  req.query = {
    ...req.query,
    status: { $eq: "published" },
    language: { $eq: req.params.language },
    limit: '25',
    sort: '-updatedAt',
    fields: '-status'
  };
  next();
};

exports.getByUser = (req, _, next) => {
  req.query = {
    ...req.query,
    teacher: { $eq: req.user._id},
  };
  next();
};

exports.getLesson = factory.getOne(Lesson)
exports.getLessonsForLanguage = factory.getAll(Lesson)

exports.createLesson = catchAsync(async (req, res) => {
  const teacher = req.user._id
  const { language } = req.body
  
  // initialize a blank lesson in order to return the _id to the user
  // they will then use this _id and apply updates as they add widgets
  const lesson = await Lesson.create({ language, teacher })

  res.status(201).json({
    success: true,
    lesson,
  })
})

exports.updateLesson = catchAsync(async (req, res) => {
  const _id = req.params.id
  const teacher = req.user._id
  const { title, widgets, status } = req.body
  const updatedAt = Date.now()

  const lesson = await Lesson.findOne({ _id, teacher })
  
  if (lesson) {
    lesson.title = title
    lesson.status = status
    lesson.widgets = widgets
    lesson.updatedAt = updatedAt

    if (lesson.status === "draft" && status === "published") {
      lesson.createdAt = Date.now()
    }
  }

  await lesson.save()

  res.status(200).json({
    success: true,
    lesson
  })

})

exports.addWidgetToLesson = catchAsync(async (req, res) => {
  const _id = req.params.id
  const teacher = req.user._id
  const { type } = req.body

  const lesson = await Lesson.findOne({ _id, teacher })
  if (!lesson) return next(new AppError(`Could not find lesson with id ${_id}`, 404))

  let widget
  switch (type) {
    case 'table':
      widget = await TableWidget.create()
      break
    case 'text':
      widget = await TextWidget.create()
      break
    case 'title':
      widget = await TitleWidget.create()
      break
    case 'translation':
      widget = await TranslationWidget.create()
      break
    default:
      return
  }
  
  widget.createdBy = teacher.toString()
  widget.forLesson = lesson._id.toString()

  await widget.save()
  lesson.widgets.push(widget)
  await lesson.save()
  
  res.status(201).json({
    success: true,
    lesson,
    widget
  })
})

exports.editWidget = catchAsync(async (req, res) => {
  const _id = req.params.id

  const widget = await Widget.findById(_id)
  if (!widget) return next(new AppError(`Could not find lesson with id ${_id}`, 404))
  if (widget.createdBy !== req.user._id.toString()) return next(new AppError("That's not yours", 403))

  const { content } = req.body
  switch (widget.type) {
    case 'TableWidget':
      widget.hasHead = req.body.hasHead
      break
    case 'TextWidget':
      widget.textAlign = req.body.textAlign
      break
    case 'TitleWidget':
    case 'TranslationWidget':
      break
  }
  widget.content = content
  await widget.save()

  res.status(200).json({
    success: true,
    widget
  })
})

/* TODO
  delete widget
  delete lesson & attached widgets

  admin edit lesson
  admin edit widget
  admin delete widget
  admin delete lesson & attached widgets
*/
