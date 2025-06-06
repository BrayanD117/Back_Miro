const Reminder = require('../models/reminder');
const User = require('../models/users');
const nodemailer = require('nodemailer');
const dayjs = require('dayjs');
const PublishedTemplate = require('../models/publishedTemplates');
const Dependency = require('../models/dependencies');
const Period = require('../models/periods');

const ReminderLog = require("../models/reminderLog");


const datetime_now = () => {
  const now = new Date();
  const offset = -5; // Colombia GMT-5
  return new Date(now.getTime() + offset * 60 * 60 * 1000);
};

async function sendReminderEmail(to, nombre, fechaLimite, plantillas = []) {
 const transporter = nodemailer.createTransport({
  host: 'smtp.pepipost.com',
  port: 587,
  secure: false, // true para 465, false para 587
  auth: {
    user: process.env.REMINDER_EMAIL,     // debe ser "unibagueg3"
    pass: process.env.REMINDER_PASS       // debe ser "1PepiUnibagueSmtp**"
  },
  tls: {
    rejectUnauthorized: false
  }
});


  const cantidad = plantillas.length;

  const listaHtml = cantidad
    ? `<ul style="padding-left: 20px;">${plantillas.map(p => `<li>${p}</li>`).join('')}</ul>`
    : "<p>No se encontraron nombres de plantillas.</p>";

  const resumen = `
    <p style="font-size: 16px;">
      Tienes <strong>${cantidad}</strong> plantilla${cantidad !== 1 ? "s" : ""} pendiente${cantidad !== 1 ? "s" : ""}.
    </p>
  `;

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject: '📩 Recordatorio de entrega pendiente',
    html: `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
    
    <!-- ICONO SUPERIOR IZQUIERDO -->
    <div style="text-align: left;">
      <img src="https://miro.unibague.edu.co/MIRO.png" alt="Logo Miró" width="64" height="64" style="vertical-align: middle;" />
    </div>

    <h2 style="color: #1d3557; text-align: center;">Recordatorio de entrega pendiente</h2>
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    ${resumen}
    <p style="font-size: 16px;">Te recordamos que debes entregar las siguientes plantillas:</p>
    ${listaHtml}
    <p style="font-size: 16px;">
      <strong style="color: #e63946;">Fecha límite:</strong> 
      <span style="font-weight: 500;">${dayjs(fechaLimite).format('DD/MM/YYYY')}</span>
    </p>
    <div style="margin: 24px 0; text-align: center;">
      <a href="https://miro.unibague.edu.co" 
         style="background-color: #457b9d; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">
        Ir a la plataforma
      </a>
    </div>
    <p style="font-size: 14px; color: #6c757d;">Por favor, asegúrate de completar tu entrega antes de la fecha límite.</p>
    <p style="font-size: 14px; color: #6c757d;"> Este mensaje fue generado automáticamente por la plataforma Miró. Le pedimos no responder al mismo.  Si tiene alguna inquietud por favor escribir al correo electrónico direcciondeplaneacion@unibague.edu.co</p>
    <hr style="border: none; border-top: 1px solid #ccc; margin: 30px 0;">
    <p style="font-size: 14px; text-align: center; color: #999;">— Equipo Miró</p>
  </div>
`

  });
}



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

runReminderEmails: async function (periodId = null, force = false) {
  const reminders = await Reminder.find();
  const today = dayjs();

  if (!periodId) {
    const activePeriod = await Period.findOne({ is_active: true }).sort({ updatedAt: -1 });
    console.log(activePeriod);
    if (!activePeriod) {
      console.log("No se encontró periodo activo");
      return 0;
    }
    periodId = activePeriod._id;
  }

  console.log(`Periodo usado para recordatorios: ${periodId}`);

  const usuarios = await User.find({ activeRole: 'Productor', isActive: true });

  const dependenciaCache = {};
  const logs = [];

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
          deadline: t.deadline
        });
      }
    }

    if (plantillasPendientes.length > 0) {
      const fechaLimiteMasProxima = plantillasPendientes.reduce((min, p) => {
        return dayjs(p.deadline).isBefore(min) ? p.deadline : min;
      }, plantillasPendientes[0].deadline);

      // Enviar correo al productor
      await sendReminderEmail(
        usuario.email,
        usuario.full_name,
        fechaLimiteMasProxima,
        plantillasPendientes.map(p => p.nombre)
      );

      // Guardar log del envío
      await ReminderLog.create({
        recipient_email: usuario.email,
        recipient_name: usuario.full_name,
        sent_at: new Date(),
        templates_sent: plantillasPendientes.map(p => p.nombre),
        deadline: fechaLimiteMasProxima,
        period_id: periodId
      });

      // Agregar al resumen
      logs.push({
        email: usuario.email,
        nombre: usuario.full_name,
        deadline: fechaLimiteMasProxima,
        plantillas: plantillasPendientes.map(p => p.nombre)
      });
    }
  }

  // Enviar correo resumen a miro@unibague.edu.co
  if (logs.length > 0) {
    await sendSummaryEmail(logs);
  }

  return logs.length;
},
}

async function sendSummaryEmail(logs) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.pepipost.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.REMINDER_EMAIL,
      pass: process.env.REMINDER_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const cantidad = logs.length;

  const listaHtml = logs.map(log => {
    const nombres = log.plantillas.join(', ');
    const fecha = dayjs(log.deadline).format('DD/MM/YYYY');
    return `<li><strong>${log.nombre}</strong> (${log.email}) — Fecha límite: <em>${fecha}</em><br>Plantillas: ${nombres}</li>`;
  }).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 700px; margin: auto; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
      <div style="text-align: left;">
        <img src="https://miro.unibague.edu.co/MIRO.png" alt="Logo Miró" width="64" height="64" />
      </div>
      <h2 style="color: #1d3557; text-align: center;">Resumen de recordatorios enviados</h2>
      <p style="font-size: 16px;">
        Se han enviado <strong>${cantidad}</strong> recordatorio${cantidad !== 1 ? "s" : ""} a los siguientes usuarios:
      </p>
      <ul style="padding-left: 20px; font-size: 15px;">
        ${listaHtml}
      </ul>
      <hr style="border: none; border-top: 1px solid #ccc; margin: 30px 0;">
      <p style="font-size: 14px; text-align: center; color: #999;">— Sistema de recordatorios automáticos de Miró</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: "miro@unibague.edu.co",
    subject: "📬 Resumen de recordatorios enviados",
    html
  });
}


module.exports = reminderController;