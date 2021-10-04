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
    $and: [
      { status: { $eq: "published" } } ,
      { language: { $eq: req.query.language } },
      { type: { $eq: req.query.type } },
    ],
    limit: '25',
    sort: 'updatedAt',
  };
  next();
};

exports.getByUser = (req, _, next) => {
  req.query = {
    ...req.query,
    $and: [
      { status: { $ne: "deleted" } },
      { language: { $eq: req.query.language } },
      { teacher: { $eq: req.user._id} },
    ],
    sort: 'createdAt',
  };
  next();
};

exports.getLesson = factory.getOne(Lesson)
exports.getLessonsForLanguage = factory.getAll(Lesson)

exports.getLessonCountForLanguage = catchAsync(async (req, res) => {
  const { language, type } = req.query
  const lesson_count = await Lesson.count({ language, status: { $eq: 'published' }, type: { $eq: type }})

  res.status(200).json({
    success: true,
    lesson_count
  })
})

exports.createLesson = catchAsync(async (req, res) => {
  const teacher = req.user._id
  const { language } = req.params

  const userHasDrafts = await Lesson.find({ teacher, language, status: { $eq: 'draft' } })
  if (userHasDrafts.length) {
    return res.json({
      success: false,
      message: "DRAFT_EXISTS"
    })
  }
  
  // initialize a blank lesson in order to return the _id to the user
  // they will then use this _id and apply updates as they add widgets
  const lesson = await Lesson.create({ language, teacher })

  res.status(201).json({
    success: true,
    lesson,
  })
})

exports.updateLesson = catchAsync(async (req, res, next) => {
  const _id = req.params.id
  const teacher = req.user._id
  const { title, widgets, status, type } = req.body
  const updatedAt = Date.now()

  const lesson = await Lesson.findOne({ _id, teacher })
  
  if (lesson) {
    lesson.title = title
    lesson.status = status
    lesson.type = type
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

exports.addWidgetToLesson = catchAsync(async (req, res, next) => {
  const _id = req.params.id
  const teacher = req.user._id
  const { type } = req.body

  const lesson = await Lesson.findOne({ _id, teacher })
  if (!lesson) {
    return res.json({
      success: false,
      message: "RESOURCE_NOT_FOUND"
    })
  }

  const availableWidgets = ['TableWidget', 'TextWidget', 'TitleWidget', 'TranslationWidget']
  if (!availableWidgets.includes(type)) {
    return res.json({
      success: false,
      message: "UNKNOWN_TYPE"
    })
  }
  let widget
  switch (type) {
    case 'TableWidget':
      widget = new TableWidget()
      break
    case 'TextWidget':
      widget = new TextWidget()
      break
    case 'TitleWidget':
      widget = new TitleWidget()
      break
    case 'TranslationWidget':
      widget = new TranslationWidget()
      break
    default:
      return
  }
  
  widget.createdBy = teacher
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

exports.editWidget = catchAsync(async (req, res, next) => {
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

  await Lesson.findByIdAndUpdate(widget.forLesson, { updatedAt: Date.now() })

  res.status(200).json({
    success: true,
    widget
  })
})

exports.deleteWidget= catchAsync(async (req, res, next) => {
  res.status(418).json({ success: true })
})

/* TODO
  delete widget
  delete lesson & attached widgets

  admin edit lesson
  admin edit widget
  admin delete widget
  admin delete lesson & attached widgets
*/
