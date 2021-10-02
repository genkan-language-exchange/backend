const express = require('express')
const authController = require('../controllers/authController')
const notificationController = require('../controllers/notificationController')

const router = express.Router()

// *****************************
// PROTECTED AND VERIFIED ROUTES
// *****************************

router.use(authController.protect) // require JWT

// global notification routes
router.get('/global', notificationController.getGlobalNotifications)
router.patch('/global/:id', notificationController.markGlobalNotificationRead)

// user notification routes
router.get('/', notificationController.aliasGetUserNotifications, notificationController.cleanUpOldNotifications, notificationController.getNotifications)
router.patch('/:id', notificationController.markNotificationRead)
router.delete('/:id', notificationController.deleteNotification)

// ************
// ADMIN ROUTES
// ************
router.use(
  authController.requiresVerified, // require email verification
  authController.restrictTo('admin', 'owner') // require elevated user role
)

router.post('/global', notificationController.createGlobalNotification)
router.delete('/global/:id', notificationController.deleteGlobalNotification)


module.exports = router
