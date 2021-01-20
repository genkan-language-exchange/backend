const express = require('express');
const passport = require('passport');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', passport.authenticate('local'), authController.login);
router.get('/logout', passport.authenticate('local'), authController.logout);

router.post('/forgotPassword', authController.forgottenPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch('/updatePassword', passport.authenticate('local'), authController.updatePassword);

router.patch('/updateMe', passport.authenticate('local'), userController.updateMe);
router.delete('/deleteMe', passport.authenticate('local'), userController.deleteMe);

router
  .route('/')
  .get(userController.getAllUsers)
  // .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
