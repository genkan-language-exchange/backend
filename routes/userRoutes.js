const express = require('express');
const router = express.Router();

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgottenPassword);
router.get('/testResetPasswordToken/:token', authController.testResetPasswordToken);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch('/validation/:token', authController.verifyAccount);
router.post('/revalidate', authController.resendValidationEmail);

// ****************
// PROTECTED ROUTES
// ****************

router.use(authController.protect)
router.get('/ping', userController.ping);
router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router
  .route('/')
  .post(userController.getUser)
  .get(userController.getPotentialPartners)

// router.route('/new').get(userController.aliasGetNew, userController.getAllUsers)
// router.route('/online').get(userController.aliasGetOnline, userController.getAllUsers)
// router.route('/custom').post(userController.getCustom)

router
  .route('/:id')
  .get(userController.getUser)
  // .post(userController.followUser)
  .patch(authController.restrictTo('admin', 'owner'), userController.updateUser)
  .delete(authController.restrictTo('admin', 'owner'), userController.deleteUser)

module.exports = router;
