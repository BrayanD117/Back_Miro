const { uploadFileToGoogleDrive, uploadFilesToGoogleDrive, deleteDriveFile, deleteDriveFiles, moveDriveFolder } = require("../config/googleDrive");
const Dimension = require("../models/dimensions");
const PubReport = require("../models/publishedReports");
const UserService = require("./users");

class PublishedReportService {
  static async findPublishedReportById(id, email, session) {
    const pubReport = await PubReport
      .findById(id)
      .populate("period")
      .populate({
        path: "report.dimensions",
        select: "name responsible",
        model: "dimensions",
        populate: {
          path: "responsible",
          match: { responsible: email }, // Filtra el campo "responsible" de la dependencia
          select: "name email", // Ajusta los campos que necesitas traer de la dependencia
        },
      })
      .populate({
        path: "filled_reports.dimension",
        select: "name responsible",
        populate: {
          path: "responsible",
          match: { responsible: email }, // Filtra el campo "responsible" de la dependencia
          select: "name email", // Ajusta los campos que necesitas traer de la dependencia
        },
      })
      .session(session);
    
    if(!pubReport) {
      throw new Error("Report not found.");
    }

    console.log(pubReport.report.dimensions)

    pubReport.report.dimensions = pubReport.report.dimensions.filter((dimension) => dimension.responsible !== null);

    pubReport.filled_reports = pubReport.filled_reports.filter((filledReport) => filledReport.dimension.responsible !== null);

    if(pubReport.report.dimensions.length === 0) {
      throw new Error("User does not have access to this report.");
    }
    return pubReport;
  }

  static async findPublishedReports(session) {
    return await PubReport.find().session(session);
  }

  static async findDraft(publishedReport) {
    return publishedReport.filled_reports.find(
      (filledReport) => filledReport.status === "En Borrador"
    );
  }

  static async findDraftById(publishedReport, filledRepId) {
    return publishedReport.filled_reports.id(filledRepId);
  }

  static async uploadReportAndAttachments(reportFile, attachments, path) {
    return Promise.all([
      reportFile ? uploadFileToGoogleDrive(reportFile, path, reportFile.originalname) : Promise.resolve({}),
      attachments.length > 0 ? uploadFilesToGoogleDrive(attachments, path) : Promise.resolve([])
    ]);
  }
  
  static mapFileData(fileHandle) {
    return {
      id: fileHandle?.id,
      name: fileHandle?.name,
      view_link: fileHandle?.webViewLink,
      download_link: fileHandle?.webContentLink,
      folder_id: fileHandle?.parents ? fileHandle.parents[0] : undefined,
      description: fileHandle?.description
    };
  }

  static async uploadDraftFiles(reportFile, attachments, path) {
    const [reportFileData, attachmentsData] = await this.uploadReportAndAttachments(reportFile, attachments, path);
    return {
      report_file: reportFile ? this.mapFileData(reportFileData) : undefined,
      attachments: attachmentsData.map(this.mapFileData),
      folder_id: reportFileData.folder_id ? reportFileData.folder_id : attachmentsData[0]?.folder_id
    };
  }

  static async updateDraftFiles(draft, reportFile, attachments, deletedReport, deletedAttachments, path) {
    const [reportFileData, attachmentsData] = await this.uploadReportAndAttachments(reportFile, attachments, path);
    draft.attachments.push(...attachmentsData.map(this.mapFileData))
    if(deletedReport) {
      await deleteDriveFile(deletedReport);
      draft.report_file = undefined
      console.log("Geeasdad", draft)
    }
    if(deletedAttachments) {
      await deleteDriveFiles(deletedAttachments);
      draft.attachments = draft.attachments.filter((attachment) => !deletedAttachments.includes(attachment.id));
    }
    if(reportFile) {
      draft.report_file = this.mapFileData(reportFileData);
    }
    return draft;
  }

  static async upsertReportDraftForDimension(
    pubReport,
    draft,
    reportFile,
    attachments,
    deletedReport,
    deletedAttachments,
    nowDate,
    path,
    user,
    dimension,
    session
  ) {
    const fullReport = await PubReport.findById(pubReport._id).session(session);
    
    if (draft) {
      const updatedDraft = await this.updateDraftFiles(
        draft,
        reportFile,
        attachments,
        deletedReport,
        deletedAttachments,
        path
      );
      updatedDraft.status_date = nowDate;
      const existingReport = fullReport.filled_reports.id(draft._id);
      const updatedReport = Object.assign(existingReport, updatedDraft);
      fullReport.filled_reports.id(draft._id).set(updatedReport);
    } else {
      const newDraft = await this.uploadDraftFiles(reportFile, attachments, path);
      newDraft.dimension = dimension;
      newDraft.send_by = user;
      newDraft.loaded_date = nowDate;
      newDraft.status_date = nowDate;
      newDraft.status = "En Borrador";
      fullReport.filled_reports.unshift(newDraft);
    }
    await fullReport.save({ session });
  }  

  static async sendResponsibleReportDraft(email, publishedReportId, nowtime, session) {
    const user = await UserService.findUserByEmailAndRole(email, "Responsable");
    const pubRep = await PubReport.findById(publishedReportId)
      .populate('filled_reports.dimension')
      .populate('period')
      .session(session);
    
    if (!pubRep) {
      throw new Error("Published report not found.");
    }
    
    const drafts = pubRep.filled_reports.filter(draft => draft.status === "En Borrador");
    
    if (drafts.length === 0) {
      throw new Error("No draft report found to send.");
    }
    
    for (const draft of drafts) {
      if (!draft.report_file) {
        throw new Error(`El borrador para la dimensión "${draft.dimension.name}" debe tener un archivo de informe.`);
      }
      
      if (pubRep.report.requires_attachment && (!draft.attachments || draft.attachments.length === 0)) {
        throw new Error(`El borrador para la dimensión "${draft.dimension.name}" debe tener al menos un anexo.`);
      }
      
      draft.attachments.forEach((attachment) => {
        if (!attachment.description || attachment.description.trim() === "") {
          throw new Error(`Cada anexo en la dimensión "${draft.dimension.name}" debe tener una descripción no vacía.`);
        }
      });
      
      const newPath = `${pubRep.period.name}/Informes/vos/${pubRep.report.name}/${draft.dimension.name}/${nowtime.toISOString()}`;
      const ancestorId = await moveDriveFolder(draft.report_file.folder_id, newPath);
      
      draft.status = "En Revisión";
      draft.loaded_date = nowtime;
      draft.send_by = user;
      
      if (!pubRep.folder_id) {
        pubRep.folder_id = ancestorId;
      }
    }
    
    await pubRep.save({ session });
  }  

}

module.exports = PublishedReportService;