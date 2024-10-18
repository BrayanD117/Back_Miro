const PubReport = require("../models/publishedReports");
const Report = require("../models/reports");
const User = require("../models/users");
const Period = require("../models/periods");
const Dimension = require("../models/dimensions");
const mongoose = require("mongoose");

const {
  uploadFileToGoogleDrive,
  uploadFilesToGoogleDrive,
  moveDriveFolder,
  deleteDriveFile,
  deleteDriveFiles,
  updateFileInGoogleDrive,
} = require("../config/googleDrive");
const UserService = require("../services/users");
const PublishedReportService = require("../services/publishedReports");
const { attachment } = require("express/lib/response");

const pubReportController = {};

const datetime_now = () => {
  const now = new Date();

  const offset = -5; // GMT-5
  const dateWithOffset = new Date(now.getTime() + offset * 60 * 60 * 1000);

  return new Date(dateWithOffset.setMilliseconds(now.getMilliseconds()));
};

pubReportController.getPublishedReports = async (req, res) => {
  try {
    const { email, page = 1, limit = 10, search = "" } = req.query;

    // Verificar si el usuario es un administrador o Productor activo
    const user = await User.findOne({
      email,
      activeRole: { $in: ["Administrador"] },
      isActive: true,
    });
    if (!user) {
      return res.status(403).json({
        status: "User not found or isn't an Administrator or Producer",
      });
    }

    // Configurar paginación
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Crear objeto de búsqueda
    const searchQuery = search.trim()
      ? {
          $or: [
            { "report.name": { $regex: search, $options: "i" } }, // Busca en el campo "report.name"
            { "period.name": { $regex: search, $options: "i" } }, // Busca en el campo "period.name"
          ],
        }
      : {};

    const publishedReports = await PubReport.find(searchQuery)
      .skip(skip)
      .limit(pageSize)
      .populate("period")
      .populate({
        path: "dimensions",
        select: "name responsible",
      })
      .populate({
        path: "filled_reports.dimension",
        select: "name responsible",
      })
      .exec();

    publishedReports.forEach((report) => {
      // Filtrar los filled_reports que no estén en "En Borrador"
      report.filled_reports = report.filled_reports.filter(
        (fr) => fr.status !== "En Borrador"
      );

      // Ordenar los filled_reports por fecha (asumiendo que tienen una propiedad 'date')
      report.filled_reports.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Eliminar duplicados de filled_reports basados en 'dimension'
      const uniqueFilledReports = [];
      const seenDimensions = new Set();

      report.filled_reports.forEach((fr) => {
        if (!seenDimensions.has(fr.dimension.toString())) {
          uniqueFilledReports.push(fr);
          seenDimensions.add(fr.dimension.toString());
        }
      });

      report.filled_reports = uniqueFilledReports;
    });

    const totalReports = await PubReport.countDocuments(searchQuery);

    // Responder con los datos paginados y la información de paginación
    res.status(200).json({
      total: totalReports,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(totalReports / pageSize),
      publishedReports,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Error getting published reports",
      error: error.message,
    });
  }
};

pubReportController.getPublishedReportsResponsible = async (req, res) => {
  try {
    const { email, page = 1, limit = 10, search = "" } = req.query;

    // Verificar si el usuario es un administrador o Productor activo
    const user = await User.findOne({
      email,
      activeRole: { $in: ["Responsable"] },
      isActive: true,
    });
    if (!user) {
      return res
        .status(403)
        .json({ status: "User not found or isn't Responsible" });
    }

    // Configurar paginación
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Crear objeto de búsqueda
    const searchQuery = search.trim()
      ? {
          $or: [
            { "report.name": { $regex: search, $options: "i" } }, // Busca en el campo "report.name"
            { "period.name": { $regex: search, $options: "i" } }, // Busca en el campo "period.name"
          ],
        }
      : {};

    const publishedReports = await PubReport.find(searchQuery)
      .skip(skip)
      .limit(pageSize)
      .populate("period")
      .populate({
        path: "dimensions",
        select: "name responsible",
        match: { responsible: email },
      })
      .populate({
        path: "filled_reports.dimension",
        select: "name responsible",
        match: { responsible: email },
      })
      .exec();
    //Gives only reports that the dimension haven't uploaded yet
    const publishedReportsFilter = publishedReports.map((report) => {
      report.filled_reports
        .filter((filledRep) => {
          return (
            filledRep.dimension !== null &&
            filledRep.dimension.responsible !== undefined
          );
        })
        .sort((a, b) => new Date(b.loaded_date) - new Date(a.loaded_date)); // Ordenar por fecha descendente
      return report;
    });
    console.log(publishedReportsFilter[0].filled_reports);

    const totalReports = publishedReports.length;
    //const publishedReportsFilter = publishedReports.filter(report => report.filled_reports.dim);
    // Responder con los datos paginados y la información de paginación
    res.status(200).json({
      total: totalReports,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(totalReports / pageSize),
      publishedReports: publishedReportsFilter,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Error getting published reports",
      error: error.message,
    });
  }
};

pubReportController.getLoadedReportsResponsible = async (req, res) => {
  try {
    const { email, page = 1, limit = 10, search = "" } = req.query;

    const user = await User.findOne({
      email,
      isActive: true,
      activeRole: "Responsable",
    });
    if (!user) {
      return res
        .status(403)
        .json({ status: "User not found or isn't an active responsible" });
    }
    // Configurar paginación
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Crear objeto de búsqueda
    const searchQuery = search.trim()
      ? {
          $or: [
            { "report.name": { $regex: search, $options: "i" } }, // Busca en el campo "report.name"
            { "period.name": { $regex: search, $options: "i" } }, // Busca en el campo "period.name"
          ],
        }
      : {};

    const publishedReports = await PubReport.find(searchQuery)
      .skip(skip)
      .limit(pageSize)
      .populate("period")
      .populate({
        path: "dimensions",
        select: "name responsible",
        match: { responsible: email },
      })
      .populate({
        path: "filled_reports.dimension",
        select: "name responsible",
        match: { responsible: email },
      })
      .where("filled_reports")
      .elemMatch({ $exists: true })
      .exec();

    const publishedReportsFilter = publishedReports.map((report) => {
      const filledReports = report.filled_reports.filter(
        (filledReport) =>
          filledReport.dimension !== null ||
          filledReport.dimension.responsible !== undefined
      );
      return {
        ...report._doc,
        filled_reports: filledReports,
      };
    });

    const totalReports = publishedReports.length;

    res.status(200).json({
      total: totalReports,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(totalReports / pageSize),
      publishedReports: publishedReportsFilter,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Error getting published reports",
      error: error.message,
    });
  }
};

pubReportController.getPublishedReport = async (req, res) => {
  const { id } = req.params;
  try {
    const publishedReport = await PubReport.findById(id);
    if (!publishedReport) {
      return res.status(404).json({ status: "Published Report not found" });
    }
    res.status(200).json(publishedReport);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: "Error getting published report", error: error.message });
  }
};

pubReportController.publishReport = async (req, res) => {
  const { reportId, periodId, dimensionsId } = req.body;
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ status: "Report not found" });
    }
    const publishedReport = new PubReport({
      report,
      period: periodId,
      dimensions: dimensionsId,
    });
    await publishedReport.save();
    res.status(200).json({ status: "Published Report created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Error creating published report",
      error: error.message,
    });
  }
};

pubReportController.feedOptionsForPublish = async (req, res) => {
  try {
    const email = req.query.email;
    const user = await User.findOne({
      email,
      isActive: true,
      activeRole: "Administrador",
    });
    if (!user) {
      return res
        .status(403)
        .json({ status: "User not found or isn't an active administrator" });
    }
    //TODO FILTER ONLY ACTIVE PERIODS
    const periods = await Period.find({ is_active: true }).select("name");
    const dimensions = await Dimension.find({}).select("name");
    res.status(200).json({ periods, dimensions });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: "Error getting feed options", error: error.message });
  }
};

pubReportController.loadResponsibleReportDraft = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, publishedReportId, filledDraftId } = req.body;
    const reportFile = req.files["reportFile"]
      ? req.files["reportFile"][0]
      : null;
    const attachments = req.files["attachments"] || [];
    const deletedReport = req.body.deletedReport ?? null;
    const deletedAttachments = req.body.deletedAttachments ?? [];

    const pubRep = await PublishedReportService.findPublishedReportById(publishedReportId, email, session);
    let draft = await PublishedReportService.findDraft(pubRep,filledDraftId,session);

    const nowtime = datetime_now();
    const nowdate = new Date(nowtime.toDateString());
    const basePath = `Reportes/Borradores/${pubRep.period.name}/${pubRep.report.name}
      /${pubRep.dimensions[0].name}/${reportDraft ? reportDraft.loaded_date.toISOString() 
      : now.toISOString()}`;
    const paths = {
      reportFilePath: basePath,
      attachmentsPath: `${basePath}/Anexos`,
    };

    await PublishedReportService.upsertReportDraft(pubRep, draft, reportFile, attachments, deletedReport, deletedAttachments, paths, session);

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ status: "Responsible report draft loaded" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(500).json({
      status: "Error loading responsible report draft",
      error: error.message,
    });
  }
  //TODO Method for loading drafts
  //Save report in google drive and return data
  //Save attachments in google drive and return data
  //Check if is first load or update
  //If is update, check which have to be deleted and/or added
  //Save report in db
  //All report must have, a report file and an array
  //of attachments with the corresponding description
  //Something like this if new: [ {file?: {...}, description: ...} ]
  //It is only possible if: no previous draft, status is draft, status is rejected
};

pubReportController.setFilledReportStatus = async (req, res) => {
  try {
    const { email, reportId, filledRepId, observations } = req.body;

    const user = await User.findOne({
      email,
      isActive: true,
      activeRole: "Administrador",
    });
    if (!user) {
      return res
        .status(403)
        .json({ status: "User not found or isn't an active administrator" });
    }

    const publishedReport = await PubReport.findById(reportId)
      .where("filled_reports")
      .elemMatch({ _id: filledRepId })
      .exec();

    if (!publishedReport) {
      return res.status(404).json({ status: "Published Report not found" });
    }

    const filledReport = publishedReport.filled_reports.id(filledRepId);
    if (!filledReport) {
      return res.status(404).json({ status: "Filled Report not found" });
    }

    console.log("This is the filled report ", filledReport);

    const now = datetime_now();
    filledReport.status = req.body.status;
    filledReport.status_date = now;
    if (req.body.status === "Rechazado" && !req.body.observations) {
      return res
        .status(400)
        .json({ status: "Observations are required for rejected reports" });
    }
    filledReport.observations = observations;
    filledReport.evaluated_by = user;
    await publishedReport.save();

    res.status(200).json({ status: "Filled report status set" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Error setting filled report status",
      error: error.message,
    });
  }
};

pubReportController.deletePublishedReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { email } = req.query;
    const user = await User.findOne({
      email,
      isActive: true,
      activeRole: "Administrador",
    });
    if (!user) {
      return res
        .status(403)
        .json({ status: "User not found or isn't an active administrator" });
    }
    console.log(req.params);
    const publishedReport = await PubReport.findById(reportId);
    if (!publishedReport) {
      return res.status(404).json({ status: "Published Report not found" });
    }

    if (publishedReport.filled_reports.length > 0) {
      return res
        .status(400)
        .json({
          status: "Cannot delete a published report with filled reports",
        });
    }

    await publishedReport.remove();
    res.status(200).json({ status: "Published Report deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Error deleting published report",
      error: error.message,
    });
  }
};

pubReportController.getHistory = async (req, res) => {
  try {
    const { reportId, dimensionId } = req.query;

    const publishedReport = await PubReport.findById(reportId)
      .where("filled_reports")
      .elemMatch({ dimension: dimensionId, status: { $ne: "En Borrador" } })
      .populate((path = "filled_reports.dimension"), (select = "name"))
      .exec();

    if (!publishedReport) {
      return res.status(404).json({ status: "Published Report not found" });
    }

    res.status(200).json(publishedReport.filled_reports);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Error getting filled report",
      error: error.message,
    });
  }
};

module.exports = pubReportController;
