const router = require('express').Router();
const controller = require('../controllers/pendingUserChanges');

// Obtener cambios pendientes
router.get('/pending', controller.getPendingChanges);

// Aprobar cambios seleccionados
router.post('/approve', controller.approveChanges);

// Rechazar cambios seleccionados
router.post('/reject', controller.rejectChanges);

// Obtener historial de cambios
router.get('/history', controller.getChangesHistory);

module.exports = router;