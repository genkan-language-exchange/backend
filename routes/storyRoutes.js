const express = require('express');
const authController = require('../controllers/authController');
const storyController = require('../controllers/storyController');

const router = express.Router();

// ****************
// PROTECTED ROUTES
// ****************

router.use(authController.protect)

router.get('/', storyController.getPublished, storyController.getStories);
router.get('/my-drafts', storyController.getDrafts, storyController.getStories);
router.post('/', storyController.createStory);

router.delete('/comment/admin/:id', storyController.adminDeleteComment);
router.put('/comment/delete/:id', storyController.deleteComment);
router.post('/comment/:id', storyController.createComment);
router.put('/comment/:id', storyController.editComment);
router.post('/like/:id', storyController.likeStory);

router.patch('/delete/:id', storyController.deleteStory);
router.get('/:id', storyController.getStory);
router.put('/:id', storyController.editStory);

// TODO: get all stories by one user

// ************
// ADMIN ROUTES
// ************

router.use(authController.restrictTo('admin', 'owner'))
router.post('/admin/clearRemoved', storyController.adminDeletedRemoved);
router.delete('/admin/:id', storyController.adminDeleteStory);

module.exports = router;
