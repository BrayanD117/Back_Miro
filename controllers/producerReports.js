const fs = require("fs");
const { uploadFileToGoogleDrive, updateFileInGoogleDrive } = require("../config/googleDrive");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Report = require("../models/reports");
const User = require("../models/users");
const Period = require("../models/periods");
const PubReport = require("../models/publishedReports");
const UserService = require("../services/users");
const ProducerReports = require("../services/producerReports");

const datetime_now = () => {
  const now = new Date();

  const offset = -5; // GMT-5
  const dateWithOffset = new Date(now.getTime() + offset * 60 * 60 * 1000);

  return new Date(dateWithOffset.setMilliseconds(now.getMilliseconds()));
};

const reportController = {};

reportController.getReports = async (req, res) => {
  try {
    const email = req.query.email;
    await UserService.findUserByEmailAndRole(email, "Administrador");
    const reports = await ProducerReports.getReports();
    res.status(200).json(reports);
  }
}

reportController.getReportsPagination = async (req, res) => {
  try {
    const { email, page = 1, limit = 10, search = "" } = req.query;

    await UserService.findUserByEmailAndRoles(email, ["Administrador", "Responsable"]);

    const report = await ProducerReports.getReportsPagination(page, limit, search);

    res.status(200).json(report);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: "Error getting reports", error: error.message });
  }
};

reportController.createReport = async (req, res) => {
  const session = await mongoose.startSession(); // Inicia una sesión de MongoDB
  session.startTransaction(); // Inicia una transacción

  try {
    const { email } = req.body;
    const { name, description, requires_attachment, file_name } = req.body;

    const user = await UserService.findUserByEmailAndRole(email, "Administrador", session);

    if (!req.file) {
      throw new Error("File is required");
    }

    const destinationPath = `Reportes/Productores/Formatos`;


    // Elimina el archivo local después de la subida exitosa

    res.status(201).json({ status: "Report created" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
  } finally {
    fs.unlinkSync(req.file.path);
    session.endSession();
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

reportController.deleteReport = async (req, res) => {

  try {
    const { id } = req.params;
    const nowDate = datetime_now().toDateString();
    const pubReportsToDelete = []

    // Buscar el informe
    const report = await Report.findByIdAndDelete(id);
    if (!report) {
      return res.status(404).json({ status: "Report not found" });
    }

    res.status(200).json({ status: "Report deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Error deleting report", error: error.message });
  }
}


module.exports = reportController;
