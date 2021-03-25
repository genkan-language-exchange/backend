const express = require('express');
const roomController = require('../controllers/roomController');

const router = express.Router();

router.post('/:roomId', roomController.sendMessage);

module.exports = router;
