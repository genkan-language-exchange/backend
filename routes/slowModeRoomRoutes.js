const express = require('express');
const slowModeRoomController = require('../controllers/slowModeRoomController');

const router = express.Router();

router.post('/:roomId', slowModeRoomController.sendMessage);

module.exports = router;
