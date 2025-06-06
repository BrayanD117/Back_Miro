const express = require('express');
const router = express.Router();
const controller = require('../controllers/reminders');

router.get('/', controller.getAllReminders);
router.post('/', controller.createReminder);
router.delete('/:id', controller.deleteReminder);
router.put('/:id', controller.updateReminder);
router.post('/test-send', controller.sendTestReminder);
router.get('/test-check', controller.checkAndSendReminderEmails);
router.post('/send-reminders', async (req, res) => {
  try {
    const resultado = await controller.runReminderEmails(null, true); // sin argumentos
    res.status(200).json({ enviados: resultado });
  } catch (error) {
    console.error("Error ejecutando runReminderEmails:", error);
    res.status(500).json({ error: error.message });
  }
});

// router.post('/send-reminders', async (req, res) => {
//   try {
//     const { periodId } = req.query;
//     const enviados = await controller.runReminderEmails(periodId, true);
//     res.json({ status: 'Envío ejecutado', total: enviados });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Fallo al ejecutar recordatorios' });
//   }
// });

module.exports = router;
