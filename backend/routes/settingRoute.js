const express = require('express');
const { getSettings, syncBiRate } = require('../controllers/settingController');

const router = express.Router();

router.get('/', getSettings);
router.post('/sync', syncBiRate); 

module.exports = router;