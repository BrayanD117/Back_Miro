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
        path: "dimensions",
        select: "name responsible",
        match: { responsible: email },
      })
      .populate({
        path: "filled_reports.dimension",
        select: "name responsible",
        match: { responsible: email },
      })
      .session(session);
    
    if(!pubReport) {
      throw new Error("Report not found.");
    }

    if(pubReport.dimensions.length===0) {
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

  static async uploadReportAndAttachments(reportFile, attachments, paths) {
    return Promise.all([
      reportFile ? uploadFileToGoogleDrive(reportFile, paths.reportFilePath, reportFile.originalname) : Promise.resolve({}),
      attachments.length > 0 ? uploadFilesToGoogleDrive(attachments, paths.attachmentsPath) : Promise.resolve([])
    ]);
  }
  
  static mapFileData(fileHandle) {
    return {
      id: fileHandle.id,
      name: fileHandle.name,
      view_link: fileHandle.webViewLink,
      download_link: fileHandle.webContentLink,
      folder_id: fileHandle.parents[0],
      description: fileHandle.description
    };
  }

  static async uploadDraftFiles(reportFile, attachments, paths) {
    const [reportFileData, attachmentsData] = await this.uploadReportAndAttachments(reportFile, attachments, paths);
    return {
      report_file: this.mapFileData(reportFileData),
      attachments: attachmentsData.map(this.mapFileData),
      folder_id: reportFileData?.parents[0]
    };
  }

  static async updateDraftFiles(draft, reportFile, attachments, deletedReport, deletedAttachments, paths) {
    const [reportFileData, attachmentsData] = await this.uploadReportAndAttachments(reportFile, attachments, paths);
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

  static async upsertReportDraft(
    pubReport, filledRepId, reportFile, attachments, deletedReport, deletedAttachments, nowDate, 
    paths, session
  ) {
    const draft = await this.findDraft(pubReport, filledRepId);
    if(draft) {
      const updatedDraft = await this.updateDraftFiles(draft, reportFile, attachments, deletedReport, deletedAttachments, paths);
      const existingReport = pubReport.filled_reports.id(filledRepId);
      const updatedReport = Object.assign(
        existingReport, updatedDraft, { loaded_date: nowDate, status_date: nowDate }
      );
      pubReport.filled_reports.id(filledRepId).set(updatedReport);
    } else {
      const newDraft = await this.uploadDraftFiles(reportFile, attachments, paths);
      newDraft.dimension = pubReport.dimensions[0];
      newDraft.send_by = pubReport.dimensions[0].responsible;
      newDraft.loaded_date = nowDate
      newDraft.status_date = nowDate
      pubReport.filled_reports.unshift(newDraft);
    }
    await pubReport.save({ session });
  }

  static async sendResponsibleReportDraft(email, publishedReportId, filledDraftId, nowtime, session) {
    const user = await UserService.findUserByEmailAndRole(email, "Responsable");
    const pubRep = await this.findPublishedReportById(publishedReportId, email, session);
    const draft = await this.findDraftById(pubRep, filledDraftId);

    console.log(filledDraftId)


    const ancestorId = await moveDriveFolder(draft.folder_id,
      `Reportes/${pubRep.period.name}/${pubRep.report.name}/${pubRep.dimensions[0].name}/${nowtime.toISOString()}`);

    if (!draft.report_file) {
      throw new Error("Draft must have a report file.");
    }

    if (pubRep.report.requires_attachment && 
      (!draft.attachments || draft.attachments.length === 0)) {
      throw new Error("Draft must have at least one attachment.");
    }

    draft.attachments.forEach((attachment) => {
      if (!attachment.description || attachment.description.trim() === "") {
      throw new Error("Each attachment must have a non-empty description.");
      }
    });

    draft.status = "En Revisión";
    draft.loaded_date = nowtime;
    draft.send_by = user;

    if(!pubRep.folder_id) {
      pubRep.folder_id = ancestorId;
    }

    await pubRep.save({ session });
  }

}

module.exports = PublishedReportService;