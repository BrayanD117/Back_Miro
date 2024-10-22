const { uploadFileToGoogleDrive, uploadFilesToGoogleDrive, deleteDriveFile, deleteDriveFiles } = require("../config/googleDrive");
const Dimension = require("../models/dimensions");
const PubReport = require("../models/publishedReports");

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
    };
  }

  static async updateDraftFiles(draft, reportFile, attachments, deletedReport, deletedAttachments, paths) {
    const [reportFileData, attachmentsData] = await this.uploadReportAndAttachments(reportFile, attachments, paths);
    draft.attachments.push(...attachmentsData.map(this.mapFileData))
    if(deletedReport) {
      await deleteDriveFile(deletedReport);
      delete draft.report_file
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
      const updatedDraft = await this.updateDraftFiles(draft, reportFile, attachments, deletedReport, deletedAttachments);
      const existingReport = pubReport.filled_reports.id(filledRepId);
      const updatedReport = Object.assign(
        existingReport, updatedDraft, { loaded_date: nowDate }
      );
      pubReport.filled_reports.id(filledRepId).set(updatedReport);
    } else {
      const newDraft = await this.uploadDraftFiles(reportFile, attachments, paths);
      newDraft.dimension = pubReport.dimensions[0];
      newDraft.send_by = pubReport.dimensions[0].responsible;
      newDraft.loaded_date = nowDate
      pubReport.filled_reports.push(newDraft);
    }
    await pubReport.save({ session });
  }

}

module.exports = PublishedReportService;