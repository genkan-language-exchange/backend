const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgottenPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch('/updatePassword', authController.protect, authController.updatePassword);

router.patch('/validation/:token', authController.verifyAccount);
router.post('/revalidate', authController.resendValidationEmail);
router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router
  .route('/')
  .post(userController.getUser)
  .get(authController.protect, userController.aliasGetAllUsers, userController.getAllUsers)

router.route('/new').get(authController.protect, userController.aliasGetNew, userController.getAllUsers)
router.route('/online').get(authController.protect, userController.aliasGetOnline, userController.getAllUsers)
// router.route('/custom').post(userController.getCustom)

router
  .route('/:id')
  .get(authController.protect, userController.getUser)
  // .post(userController.followUser)
  .patch(authController.protect, authController.restrictTo('admin', 'owner'), userController.updateUser)
  .delete(authController.protect, authController.restrictTo('admin', 'owner'), userController.deleteUser)

module.exports = router;
