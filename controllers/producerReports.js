const fs = require("fs");
const { uploadFileToGoogleDrive, updateFileInGoogleDrive } = require("../config/googleDrive");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Report = require("../models/reports");
const User = require("../models/users");
const Period = require("../models/periods");
const PubReport = require("../models/publishedReports");
const UserService = require("../services/users");
const ProducerReportsService = require("../services/producerReports");
const PublishedProducerReport = require("../models/publishedProducerReports");
const ProducerReport = require("../models/producerReports");
const { Types } = require("mongoose");
const { deleteDriveFile } = require("../config/googleDrive");

const datetime_now = () => {
  const now = new Date();

  const offset = -5; // GMT-5
  const dateWithOffset = new Date(now.getTime() + offset * 60 * 60 * 1000);

  return new Date(dateWithOffset.setMilliseconds(now.getMilliseconds()));
};

const reportController = {};

reportController.getReport = async (req, res) => {
  try {
    const email = req.query.email;
    const id = req.params.id;
    await UserService.findUserByEmailAndRole(email, "Administrador");
    const report = await ProducerReportsService.getReport(id);
    res.status(200).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Error getting report", error: error.message });
  }
}

reportController.getReports = async (req, res) => {
  try {
    const email = req.query.email;
    const periodId = req.query.periodId || null;

    await UserService.findUserByEmailAndRole(email, "Administrador");
    console.log("what");
    const reports = await ProducerReportsService.getReports(periodId);
    res.status(200).json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Error getting reports", error: error.message });
  }
}

reportController.getReportsPagination = async (req, res) => {
  try {
    const { email, page = 1, limit = 100, search = "" } = req.query;

    await UserService.findUserByEmailAndRoles(email, ["Administrador", "Responsable"]);

    const report = await ProducerReportsService.getReportsPagination(page, limit, search);

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
    const { name, description, requires_attachment, file_name, dimensions, producers } = req.body;

    console.log(dimensions, producers)

    const user = await UserService.findUserByEmailAndRole(email, "Administrador", session);

    if (!req.file) {
      throw new Error("File is required");
    }

    if(!name || !description || !requires_attachment || !file_name 
      || dimensions?.length === 0 || producers?.length === 0) {
            throw new Error("All fields are required");
    }

      const invalidFileNameChars = /[<>:"/\\|?*]/;
    if (invalidFileNameChars.test(req.body.file_name)) {
    return res.status(400).json({
      error: "El nombre del archivo contiene caracteres no permitidos: <>:\"/\\|?*"
    });
  }

    await ProducerReportsService.createReport(user, name, description, req.file, file_name, 
      dimensions, producers, requires_attachment, session);

    await session.commitTransaction();

    res.status(201).json({ status: "Report created" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(400).json({ status: "Error creating report", error: error.message });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
    session.endSession();
  }
};

reportController.updateReport = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id, email, requires_attachment, description, name, file_name, dimensions, producers } = req.body;
    session.startTransaction();

    const invalidFileNameChars = /[<>:"/\\|?*]/;
    if (invalidFileNameChars.test(req.body.file_name)) {
    return res.status(400).json({
      error: "El nombre del archivo contiene caracteres no permitidos: <>:\"/\\|?*"
    });
  }
    
    await UserService.findUserByEmailAndRole(email, "Administrador", session);
    if(!name || !description || !requires_attachment || !file_name 
      || dimensions?.length === 0 || producers?.length === 0) {
            throw new Error("All fields are required");
    }
    await ProducerReportsService.updateReport(id, name, description, req.file, file_name, dimensions, producers, requires_attachment, session);
    await session.commitTransaction();
    res.status(200).json({ status: "Report updated" });
  } catch (error) {
    await session.abortTransaction();
    if(error.status === 401) 
      res.status(401).json({ message: "Cannot update this report because it is already filled in a published report" });
    else 
      res.status(500).json({ status: "Error updating report", error: error.message });
    
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
    session.endSession();
  }
}

reportController.deleteProducerReport = async (req, res) => {
  const { id } = req.params;

console.log("efjejfej");

  console.log(id);

  try {
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "ID no válido." });
    }

    const isPublished = await PublishedProducerReport.findOne({ "report._id": ObjectId(id) });

    if (isPublished) {
      return res.status(400).json({
        status: "error",
        message: "No se puede eliminar este informe ya que está asignado a uno o más periodos."
      });
    }

const report = await ProducerReport.findById(id);
const fileId = report?.report_example?.id;

if (fileId) {
  try {
    await deleteDriveFile(fileId);
    console.log(`✅ Archivo eliminado de Drive: ${fileId}`);
  } catch (err) {
    console.error(`❌ No se pudo eliminar el archivo de Drive (${fileId}):`, err.message || err);

    // Si el error NO es 404, detiene todo
    return res.status(500).json({
      status: "error",
      message: "No se pudo eliminar el archivo en Drive. El informe no fue eliminado."
    });
  }
}

// Si se llegó hasta aquí, significa que:
// - no había archivo
// - o se eliminó correctamente en Drive

await ProducerReport.findByIdAndDelete(id);

return res.status(200).json({
  status: "success",
  message: "Informe eliminado correctamente."
});
  } catch (error) {
    console.error("Error deleting producer report:", error);
    return res.status(500).json({
      status: "error",
      message: error?.message || "Error desconocido al intentar eliminar el informe."
    });
  }
};

module.exports = reportController;