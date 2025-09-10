const express = require('express');
const EnchantmentController = require('../controllers/enchantmentController');

const router = express.Router();

router.post('/', EnchantmentController.createMessage);
router.get('/approved', EnchantmentController.getApprovedMessages);
router.get('/video_status/:videoId', EnchantmentController.getVideoStatus);

module.exports = router;