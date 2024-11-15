const { uploadFileToGoogleDrive, uploadFilesToGoogleDrive, deleteDriveFile, deleteDriveFiles, moveDriveFolder } = require("../config/googleDrive");
const PubReport = require("../models/publishedProducerReports");
const UserService = require("./users");

class PublishedReportService {
  static async findPublishedReportById(id, session) {
    const pubReport = await PubReport
    .findById(id)
    .populate("period")
    .populate({
      path: "report.producers",
      select: "name responsible",
      model: "dependencies",
    })
    .populate({
      path: "report.dimensions",
      select: "name",
      model: "dependencies",
    })
    .populate({
      path: "filled_reports.dependency",
      select: "name responsible",
      populate: {
        path: "responsible",
        select: "name email",
      },
    })
    .session(session);

    if (pubReport?.filled_reports) {
      const filteredReports = Object.values(
        pubReport.filled_reports.reduce((acc, report) => {
          const depId = report.dependency._id.toString();
          if (!acc[depId] || new Date(report.date) > new Date(acc[depId].date)) {
            acc[depId] = report;
          }
          return acc;
        }, {})
      );
      pubReport.filled_reports = filteredReports;
    }

    if(!pubReport) {
      throw new Error("Report not found.");
    }

    return pubReport;
  }

  static async findPublishedReports(user, page = 1, limit = 10, search = "", session) {
    const skip = (page - 1) * limit;
    const query = search ? { "report.name": { $regex: search, $options: "i" } } : {};
    let reports;
    if (user.activeRole === "Responsable") {
      reports = await PubReport.find(query)
        .populate({
          path: 'report.dimensions',
          model: 'dimensions',
          populate: {
            path: 'responsible',
            model: 'dependencies',
            match: { responsible: user.email }
          }
        })
        .populate('period')
        .skip(skip)
        .limit(limit)
        .session(session);

      reports = reports.filter(report =>
        report.report.dimensions.some(
          dimension => dimension.responsible !== null
        )
      );
    } else {
      reports = await PubReport.find(query)
        .populate({
          path: 'period',
          select: 'name producer_end_date'
        })
        .skip(skip)
        .limit(limit)
        .session(session);
    }

    const totalReports = reports.length;
    return {
      total: totalReports,
      page,
      limit,
      totalPages: Math.ceil(totalReports / limit),
      publishedReports: reports
    };
  }

  static async findDraft(publishedReport) {
    return publishedReport.filled_reports.find(
      (filledReport) => filledReport.status === "En Borrador"
    );
  }

  static async publishReport(report, periodId, deadline, session) {
    try {
      const pubReport = new PubReport({
        period: periodId,
        report,
        deadline
      });

      await pubReport.save({ session });
    } catch (error) {
      console.error('Error publishing report:', error);
      throw new Error('Internal Server Error');
    }
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
      folder_id: reportFileData.folder_id ? reportFileData.folder_id : attachmentsData[0].folder_id
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

  static async upsertReportDraft(
    pubReport, filledRepId, reportFile, attachments, deletedReport, deletedAttachments, nowDate, 
    path, session
  ) {
    const draft = await this.findDraft(pubReport, filledRepId);
    if(draft) {
      const updatedDraft = await this.updateDraftFiles(draft, reportFile, attachments, deletedReport, deletedAttachments, path);
      const existingReport = pubReport.filled_reports.id(filledRepId);
      const updatedReport = Object.assign(
        existingReport, updatedDraft, { loaded_date: nowDate, status_date: nowDate }
      );
      pubReport.filled_reports.id(filledRepId).set(updatedReport);
    } else {
      const newDraft = await this.uploadDraftFiles(reportFile, attachments, path);
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


    const ancestorId = await moveDriveFolder(draft.report_file.folder_id,
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