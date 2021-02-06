const express = require('express');
const passport = require('passport');
const roomController = require('../controllers/roomController');

const router = express.Router();

router.post('/:roomId', roomController.sendMessage);

module.exports = router;
