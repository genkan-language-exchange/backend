const express = require('express');
const authController = require('../controllers/authController');
const storyController = require('../controllers/storyController');

const router = express.Router();

router.get('/', storyController.getStories);
router.post('/', authController.protect, storyController.createStory);

router.put('/comment/delete/:id', authController.protect, storyController.deleteComment);
router.post('/comment/:id', authController.protect, storyController.createComment);
router.put('/comment/:id', authController.protect, storyController.editComment);
router.post('/like/:id', authController.protect, storyController.likeStory);

router.put('/delete/:id', authController.protect, storyController.deleteStory);
router.get('/:id', storyController.getStory);
router.put('/:id', authController.protect, storyController.editStory);

// TODO: get all stories by one user

router.delete('/admin/:id', authController.protect, authController.restrictTo('admin', 'owner'), storyController.adminDeleteStory);

module.exports = router;
