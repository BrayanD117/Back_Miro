const fs = require("fs");
const { uploadFileToGoogleDrive, updateFileInGoogleDrive } = require("../config/googleDrive");

const Report = require("../models/reports");
const User = require("../models/users");

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
  try {
    const { id } = req.params;
    const { email } = req.body;
    const { name, description, requires_attachment, file_name } = req.body;
    const user = await User.findOne({ email, activeRole: "Administrador" });

    console.log(req.body)

    if (!user) {
      return res
        .status(403)
        .json({ status: "User not found or isn't an Administrator" });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ status: "Report not found" });
    }

    if (req.file) {
      // Define la ruta en Google Drive y sube el archivo
      const fileData = await updateFileInGoogleDrive(
        report.report_example_id,
        req.file,
        file_name
      );

      // Actualiza el informe con la información del archivo subido
      report.report_example_id = fileData.id;
      report.report_example_link = fileData.webViewLink;
      report.report_example_download = fileData.webContentLink;
      // Elimina el archivo local después de la subida exitosa
      fs.unlinkSync(req.file.path);
    }

    // Actualiza los campos del informe
    report.name = name;
    report.description = description;
    report.requires_attachment = requires_attachment;
    report.file_name = file_name;

    // Guarda los cambios en el informe
    await report.save();

    res.status(200).json({ status: "Report updated" });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.log(error);
    res
      .status(500)
      .json({ status: "Error updating report", error: error.message });
  }
};

module.exports = reportController;
