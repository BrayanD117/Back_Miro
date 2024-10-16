class PublishedReportService {
  static async findPublishedReportById(id, session) {
    return await PubReport.findById(id).session(session);
  }

  static async findPublishedReports(session) {
    return await PubReport.find().session(session);
  }

  static async findDraft(publishedReport, filledRepId) {
    return publishedReport.filled_reports.find(
      (filledReport) => filledReport._id.toString() === filledRepId && filledReport.status === "En Borrador"
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

  static async uploadReportDraft(reportFile, attachments, nowDate, paths) {
    const [reportFileData, attachmentsData] = await this.uploadReportAndAttachments(reportFile, attachments, paths);
    return {
      report_file: this.mapFileData(reportFileData),
      attachments: attachmentsData.map(this.mapFileData),
      status_date: nowDate
    };
  }

  static async updateDraft(draft, reportFile, attachments, paths) {
    const [reportFileData, attachmentsData] = await this.uploadReportAndAttachments(reportFile, attachments, paths);
    draft.report_file = this.mapFileData(reportFileData);
    draft.attachments = attachmentsData.map(this.mapFileData);
    return draft;
  }
}

module.exports = PublishedReportService;