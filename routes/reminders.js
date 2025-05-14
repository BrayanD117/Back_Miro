const express = require('express');
const router = express.Router();
const controller = require('../controllers/reminders');

router.get('/', controller.getAllReminders);
router.post('/', controller.createReminder);
router.delete('/:id', controller.deleteReminder);
router.put('/:id', controller.updateReminder);
router.post('/test-send', controller.sendTestReminder);
router.get('/test-check', controller.checkAndSendReminderEmails);


module.exports = router;
