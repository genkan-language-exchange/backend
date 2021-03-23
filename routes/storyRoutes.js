const express = require('express');
const authController = require('../controllers/authController');
const storyController = require('../controllers/storyController');

const router = express.Router();

router.get('/', storyController.getStories);
router.post('/', authController.protect, storyController.createStory);

router.post('/like/:id', authController.protect, storyController.likeStory);
router.get('/:id', storyController.getStory);
router.put('/:id', authController.protect, storyController.editStory);
router.delete('/:id', authController.protect, storyController.deleteStory);

// TODO: get all stories by one user

router.delete('/admin/:id', authController.protect, authController.restrictTo('admin', 'owner'), storyController.adminDeleteStory);

module.exports = router;
