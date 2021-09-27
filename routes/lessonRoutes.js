const express = require('express')
const authController = require('../controllers/authController')
const lessonController = require('../controllers/lessonController')

const router = express.Router()

// *****************************
// PROTECTED AND VERIFIED ROUTES
// *****************************

router.use(authController.protect) // require JWT
router.get('/:language', lessonController.getPublished, lessonController.getLessonsForLanguage)
router.get(
  '/:language/MyLessons', // when viewing own lessons to edit
  lessonController.getByUser,
  lessonController.getLessonsForLanguage
)
router.get(
  '/:language/UserLessons', // when viewing a user's profile
  lessonController.getPublished,
  lessonController.getByUser,
  lessonController.getLessonsForLanguage
)
router.get('/:language/:id', lessonController.getLesson)

router.use(
  authController.requiresVerified, // require email verification
  authController.restrictTo('vip', 'admin', 'owner') // require elevated user role
)

// lesson
router.post('/new', lessonController.createLesson)
router.patch('/:id/edit', lessonController.updateLesson)

// widgets
router.post('/:id/widget', lessonController.addWidgetToLesson)
router.patch('/:id/widget/edit', lessonController.editWidget)

// ************
// ADMIN ROUTES
// ************

// router.use(authController.restrictTo('admin', 'owner'))

module.exports = router
