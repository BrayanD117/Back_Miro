const Reminder = require('../models/reminder');
const User = require('../models/users');
const dayjs = require('dayjs');
const PublishedTemplate = require('../models/publishedTemplates');
const Dependency = require('../models/dependencies');
const Period = require('../models/periods');
const PubProdReport = require("../models/publishedProducerReports");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const ReminderLog = require("../models/reminderLog");
const RemindersService = require('../services/reminders');

const datetime_now = () => {
  const now = new Date();
  const offset = -5; // Colombia GMT-5
  return new Date(now.getTime() + offset * 60 * 60 * 1000);
};

async function getPendingTemplates(periodId) {
  const today = dayjs();
  const productores = await User.find({ activeRole: 'Productor', isActive: true });

  const pendientes = [];

  for (const user of productores) {
    const templates = await PublishedTemplate.find({
      'template.producers': user.dep_code,
      period: periodId, 
    })
      .populate('template')
      .lean();

    for (const t of templates) {
      const yaEnviada = t.loaded_data?.some((d) => d.dependency === user.dep_code);
      if (!yaEnviada && dayjs(t.deadline).isAfter(today)) {
        pendientes.push({
          email: user.email,
          nombre: user.full_name,
          deadline: t.deadline,
          plantillaNombre: t.template?.name || "Plantilla sin nombre",
        });
      }
    }
  }

  return pendientes;
}

const reminderController = {
  getAllReminders: async (req, res) => {
    const reminders = await Reminder.find().sort({ daysBefore: 1 });
    res.json(reminders);
  },

  createReminder: async (req, res) => {
    const reminder = new Reminder(req.body);
    await reminder.save();
    res.json(reminder);
  },

  deleteReminder: async (req, res) => {
    const { id } = req.params;
    await Reminder.findByIdAndDelete(id);
    res.json({ success: true });
  },

 
checkAndSendReminderEmails: async (req, res) => {
  try {
    const reminders = await Reminder.find();
    const today = dayjs();
    const periodId = req.query.periodId;

    if (!periodId) {
      return res.status(400).json({ error: "Falta periodId" });
    }

    console.log("Iniciando revisión de recordatorios...");
    console.log("Días configurados para envío:", reminders.map(r => r.daysBefore));
    console.log("Fecha actual:", today.format("YYYY-MM-DD"));
    console.log("Periodo recibido:", periodId);

    const usuario = await User.findOne({ email: 'practicantes.g3@unibague.edu.co' });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario de prueba no encontrado' });
    }

    const dependencia = await Dependency.findOne({ dep_code: usuario.dep_code });
    if (!dependencia) {
      return res.status(404).json({ error: 'Dependencia del usuario no encontrada' });
    }

    console.log(` Usuario: ${usuario.full_name} (${usuario.email}) | dep_code: ${usuario.dep_code}`);

    const templates = await PublishedTemplate.find({
      'template.producers': dependencia._id,
      period: periodId,
    }).populate('template').lean();

    console.log(`Plantillas encontradas para el usuario: ${templates.length}`);

    let plantillasPendientes = [];

    for (const t of templates) {
      const yaEnviada = t.loaded_data?.some((d) => d.dependency === usuario.dep_code);
      const diasRestantes = dayjs(t.deadline).diff(today, 'day');
      const match = reminders.some((r) => r.daysBefore === diasRestantes);

      console.log(` Plantilla: ${t.template?.name} | Deadline: ${t.deadline} | Días restantes: ${diasRestantes} | Ya enviada: ${yaEnviada} | Match: ${match}`);

      if (!yaEnviada && dayjs(t.deadline).isAfter(today) && match) {
        plantillasPendientes.push(t.template?.name || 'Plantilla sin nombre');
      }
    }

    if (plantillasPendientes.length > 0) {
      await sendReminderEmail(
        "juan.gonzalez10@unibague.edu.co",
        usuario.full_name,
        templates[0].deadline, 
        plantillasPendientes
      );
      console.log(` Total de correos enviados: 1 con ${plantillasPendientes.length} plantilla(s)`);
      return res.status(200).json({ status: 'Correo enviado', total: 1, plantillas: plantillasPendientes });
    } else {
      console.log("No hay plantillas que coincidan con el día configurado.");
      return res.status(200).json({ status: 'Sin correos por enviar', enviados: 0 });
    }

  } catch (error) {
    console.error(" Error al enviar recordatorios:", error);
    res.status(500).json({ error: 'Fallo al enviar recordatorios' });
  }
},

updateReminder: async (req, res) => {
  const { id } = req.params;
  const { daysBefore } = req.body;

  try {
    const updated = await Reminder.findByIdAndUpdate(id, { daysBefore }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando recordatorio' });
  }
},

sendTestReminder: async (req, res) => {
  const { to, nombre, fechaLimite, plantillas } = req.body;

  if (!to || !nombre || !fechaLimite) {
    return res.status(400).json({ error: 'Faltan campos requeridos: to, nombre, fechaLimite' });
  }

  try {
    await sendReminderEmail(to, nombre, fechaLimite, plantillas || []);
    res.status(200).json({ status: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar correo de prueba:', error);
    res.status(500).json({ error: 'Error enviando el correo' });
  }
},

previewReminderEmails: async (periodId = null, force = false) =>{
  const reminders = await Reminder.find();
  const today = dayjs();

  if (!periodId) {
    const activePeriod = await Period.findOne({ is_active: true }).sort({ updatedAt: -1 });
    if (!activePeriod) {
      console.log("No se encontró periodo activo");
      return [];
    }
    periodId = activePeriod._id;
  }

  // Obtener correos ya registrados en ReminderLog
  const logs = await ReminderLog.find({ period_id: periodId });
  const correosYaEnviados = logs.map((log) => log.recipient_email);

  // Productores con el rol en roles[] y activos
  const usuarios = await User.find({
    roles: 'Productor',
    isActive: true,
    email: { $nin: correosYaEnviados },
  });

  const dependenciaCache = {};
  const resultado = [];

  for (const usuario of usuarios) {
    const dependencia = dependenciaCache[usuario.dep_code] ||
      await Dependency.findOne({ dep_code: usuario.dep_code });

    if (!dependencia) continue;
    dependenciaCache[usuario.dep_code] = dependencia;

    const templates = await PublishedTemplate.find({
      'template.producers': dependencia._id,
      period: periodId,
    }).populate('template').lean();

    let plantillasPendientes = [];

    for (const t of templates) {
      const yaEnviada = t.loaded_data?.some((d) => d.dependency === usuario.dep_code);
      const diasRestantes = dayjs(t.deadline).diff(today, 'day');
      const match = force ? true : reminders.some((r) => r.daysBefore === diasRestantes);

      if (!yaEnviada && dayjs(t.deadline).isAfter(today) && match) {
        plantillasPendientes.push({
          nombre: t.template?.name || 'Plantilla sin nombre',
          deadline: t.deadline,
        });
      }
    }

    if (plantillasPendientes.length > 0) {
      const fechaLimiteMasProxima = plantillasPendientes.reduce((min, p) => {
        return dayjs(p.deadline).isBefore(min) ? p.deadline : min;
      }, plantillasPendientes[0].deadline);

      resultado.push({
        nombre: usuario.full_name,
        email: usuario.email,
        deadline: fechaLimiteMasProxima,
        plantillas: plantillasPendientes.map(p => p.nombre),
      });
    }
  }

return {
  total: resultado.length,
  usuarios: resultado
};
},

sendGenericReminders: async function (req, res) {
  const { type = "plantilla", periodId = null } = req.query;

  try {
    let sent = 0;

    if (type === "informe") {
      sent = await RemindersService.runPendingProducerReportEmails(periodId);
    } else if (type === "plantilla") {
      sent = await RemindersService.runReminderEmails(periodId, true);
    } else {
      return res.status(400).json({ error: "Tipo de recordatorio no válido." });
    }

    return res.status(200).json({ sent });
  } catch (error) {
    console.error("Error al enviar recordatorios genéricos:", error);
    return res.status(500).json({ error: error.message });
  }
},
}

module.exports = reminderController;