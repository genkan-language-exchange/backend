const express = require('express');
const passport = require('passport');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', passport.authenticate('local'), authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgottenPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch('/updatePassword', authController.updatePassword);

router.patch('/validation/:token', authController.verifyAccount);
router.post('/revalidate', authController.resendValidationEmail);

router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router
  .route('/')
  .post(userController.getUser)
  .get(userController.getAllUsers)

router
  .route('/:id')
  .get(userController.getUser)
  .patch(authController.protect, authController.restrictTo('admin', 'owner'), userController.updateUser)
  .delete(authController.protect, authController.restrictTo('admin', 'owner'), userController.deleteUser)

module.exports = router;
