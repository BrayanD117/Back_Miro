const fs = require("fs");
const { uploadFileToGoogleDrive, updateFileInGoogleDrive } = require("../config/googleDrive");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const Report = require("../models/reports");
const User = require("../models/users");
const Period = require("../models/periods");
const PubReport = require("../models/publishedReports");

const datetime_now = () => {
  const now = new Date();

  const offset = -5; // GMT-5
  const dateWithOffset = new Date(now.getTime() + offset * 60 * 60 * 1000);

  return new Date(dateWithOffset.setMilliseconds(now.getMilliseconds()));
};

const reportController = {};

reportController.getReports = async (req, res) => {
  try {
    const { email, page = 1, limit = 10, search = "" } = req.query;

    // Verificar si el usuario es un administrador activo
    const user = await User.findOne({ email, activeRole: "Administrador" });
    if (!user) {
      return res
        .status(403)
        .json({ status: "User not found or isn't an Administrator" });
    }

    // Convertir los parámetros a números y calcular el salto de documentos
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Crear el filtro de búsqueda, buscando en todas las columnas relevantes
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } }, // 'i' para insensible a mayúsculas
            { description: { $regex: search, $options: "i" } },
            { "created_by.email": { $regex: search, $options: "i" } }, // Búsqueda en el email del creador
          ],
        }
      : {};

    // Obtener los reportes con el filtro de búsqueda y paginación
    const reports = await Report.find(searchQuery).skip(skip).limit(pageSize);

    // Obtener el total de documentos que coinciden con la búsqueda
    const totalReports = await Report.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalReports / pageSize);

    res.status(200).json({
      reports,
      currentPage: pageNumber,
      totalPages,
      totalReports,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: "Error getting reports", error: error.message });
  }
};

reportController.createReport = async (req, res) => {
  try {
    const { email } = req.body;
    const { name, description, requires_attachment, file_name } = req.body;
    const user = await User.findOne({ email, activeRole: "Administrador" });

    if (!user || user.activeRole !== "Administrador") {
      return res
        .status(403)
        .json({ status: "User not found or isn't an Administrator" });
    }

    if (!req.file) {
      return res.status(400).json({ status: "No file attached" });
    }

    // Crea el informe
    const newReport = new Report({
      name,
      description,
      requires_attachment,
      file_name,
      created_by: user,
    });

    // Guarda el informe en la base de datos
    await newReport.save();

    // Define la ruta en Google Drive y sube el archivo
    const destinationPath = `Reportes/Formatos`;
    const fileData = await uploadFileToGoogleDrive(
      req.file,
      destinationPath,
      file_name
    );

    // Actualiza el informe con la información del archivo subido
    newReport.report_example_id = fileData.id;
    newReport.report_example_link = fileData.webViewLink;
    newReport.report_example_download = fileData.webContentLink;

    // Guarda los cambios en el informe
    await newReport.save();

    // Elimina el archivo local después de la subida exitosa
    fs.unlinkSync(req.file.path);

    res.status(201).json({ status: "Report created" });
  } catch (error) {
    console.log(error);

    // En caso de error, elimina el archivo si existe
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res
      .status(500)
      .json({ status: "Error creating report", error: error.message });
  }
};

reportController.updateReport = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { email, name, description, requires_attachment, file_name } = req.body;
    const nowDate = datetime_now().toDateString();
    const pubReportsToUpdate = []

    // Buscar al usuario
    const user = await User.findOne({ email, activeRole: "Administrador" }).session(session);
    if (!user) {
      throw new Error("User not found or isn't an Administrator");
    }

    // Buscar el informe
    const report = await Report.findById(id).session(session);
    if (!report) {
      throw new Error("Report not found");
    }

    // Buscar periodos activos
    const periods = await Period.find({
      is_active: true,
      responsible_start_date: { $lte: nowDate },
      responsible_end_date: { $gte: nowDate }
    }).session(session);

    if (periods.length > 0) {
      const publishedReportsRelated = await PubReport.find({
        'report._id': new ObjectId(id),
        period: { $in: periods.map(period => period._id) }
      }).session(session);

      for (const pubReport of publishedReportsRelated) {
        if (pubReport.filled_reports.length > 0) {
          res.status(400).json({ message: "Cannot update this report because it is already filled in a published report" });
          return
        }
        pubReportsToUpdate.push(pubReport)
      }
    }

    // Manejo de archivo si existe
    if (req.file) {
      const fileData = await updateFileInGoogleDrive(report.report_example_id, req.file, file_name);

      // Actualiza los campos relacionados con el archivo
      report.report_example_id = fileData.id;
      report.report_example_link = fileData.webViewLink;
      report.report_example_download = fileData.webContentLink;

      // Eliminar archivo local
      fs.unlinkSync(req.file.path);
    }

    // Actualiza los campos del informe
    report.name = name;
    report.description = description;
    report.requires_attachment = requires_attachment;
    report.file_name = file_name;
      
    await report.save({ session });

    for (const pubReport of pubReportsToUpdate) {
      pubReport.report = report;
      await pubReport.save({ session });
    }

    // Commit de la transacción
    await session.commitTransaction();
    res.status(200).json({ status: "Report updated successfully" });
  } catch (error) {
    // Abortar transacción y limpiar si hay error
    await session.abortTransaction();
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    res.status(400).json({ status: "Error updating report", error: error.message });
  } finally {
    // Finalizar la sesión de la transacción
    session.endSession();
  }
};


module.exports = reportController;
