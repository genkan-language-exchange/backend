const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./factory')

const Notification = require('../models/notifications/notificationsModel')
const GlobalNotification = require('../models/notifications/globalNotificationsModel')

// ********************
// Global Notifications
// ********************

exports.getGlobalNotifications = factory.getAll(GlobalNotification)

exports.markGlobalNotificationRead = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const gNotification = await GlobalNotification.findById(id)
  if (!gNotification) return next(new AppError('Notification not found!', 404))

  gNotification.readBy.push(req.user._id)
  gNotification.save()

  res.status(200).json({
    success: true
  })
})

exports.createGlobalNotification = catchAsync(async (req, res) => {
  const { title, content, displayForWeeks = 1 } = req.body
  const createdAt = Date.now()

  const d = new Date();
  const displayUntil = d.setTime(d.getTime() + (1000 * 60 * 60 * 24 * 7 * displayForWeeks)) // default 1 week

  const readBy = [req.user._id]
  const globalNotification = await GlobalNotification.create({ readBy, title, content, createdAt, displayUntil })

  res.status(200).json({
    success: true,
    globalNotification
  })
})

exports.deleteGlobalNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params
  const gNotification = await GlobalNotification.findById(id)
  gNotification.status = 'deleted'
  gNotification.save()

  res.status(204).json({
    success: true
  })
})

// ***************************
// User Specific Notifications
// ***************************

exports.aliasGetUserNotifications = catchAsync(async (req, _, next) => {
  req.query = {
    ...req.query,
    for: { $eq: req.user._id },
    read: { $eq: false },
    sort: 'createdAt',
  }
  next()
})

exports.cleanUpOldNotifications = catchAsync(async (req, _, next) => {
  await Notification.deleteMany({ for: req.user._id, shouldClean: { $eq: true }, cleanAt: { $lt: Date.now() } })
  next()
})

exports.getNotifications = factory.getAll(Notification)

exports.markNotificationRead = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const notification = await Notification.findById(id)
  if (!notification) return next(new AppError('Notification not found!', 404))

  notification.read = true
  notification.save()

  res.status(200).json({
    success: true
  })
})

exports.deleteNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params
  Notification.findByIdAndDelete(id)

  res.status(204).json({
    success: true
  })
})
