const express = require('express');
const authController = require('../controllers/authController');
const storyController = require('../controllers/storyController');

const router = express.Router();

// ****************
// PROTECTED ROUTES
// ****************

router.use(authController.protect);

router.get('/', storyController.getPublished, storyController.getStories);
router.get('/my-drafts', storyController.getDrafts, storyController.getStories);
router.post('/user-stories', storyController.getUserStories, storyController.getStories)
router.patch('/delete/:id', storyController.deleteStory);

// ****************
// VERIFIED ROUTES
// ****************

router.use(authController.requiresVerified);

router.post('/', storyController.createStory);
router.get('/:id', storyController.getStory);
router.put('/:id', storyController.editStory);
router.post('/like/:id', storyController.likeStory);
router.post('/comment/:id', storyController.createComment);
router.put('/comment/:id', storyController.editComment);
router.put('/comment/delete/:id', storyController.deleteComment);

// ************
// ADMIN ROUTES
// ************

router.use(authController.restrictTo('admin', 'owner'));
router.post('/admin/clearRemoved', storyController.adminDeletedRemoved);
router.delete('/comment/admin/:id', storyController.adminDeleteComment);
router.delete('/admin/:id', storyController.adminDeleteStory);

module.exports = router;
