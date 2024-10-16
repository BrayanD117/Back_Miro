class PublishedReportService {
  static async findPublishedReportById(id, session) {
    return await PubReport.findById(id).session(session);
  }

  static async findPublishedReports(session) {
    return await PubReport.find().session(session);
  }

  static async validateDraft(publishedReport, filledRepId) {
    return publishedReport.filled_reports.find(
      (filledReport) => filledReport._id.toString() === filledRepId && filledReport.status === "En Borrador"
    );
  }

  static async uploadFilesToDrive(reportFile, attachments, paths) {
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
    };
  }
}