const { default: mongoose } = require("mongoose");
const PeriodService = require("../services/period");
const ProducerReportsService = require("../services/producerReports");
const PublishedReportService = require("../services/publishedProducerReports");
const UserService = require("../services/users");

const datetime_now = () => {
  const now = new Date();

  const offset = -5; // GMT-5
  const dateWithOffset = new Date(now.getTime() + offset * 60 * 60 * 1000);

  return new Date(dateWithOffset.setMilliseconds(now.getMilliseconds()));
};

const pubProdReportController = {};

pubProdReportController.getPublishedProducerReport = async (req, res) => {
  try {
    const {id} = req.params;
    const {email} = req.query;
    await UserService.findUserByEmailAndRoles(email, ["Responsable", "Administrador"]);
    const report = await PublishedReportService.findPublishedReportById(id);
    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching published producer report:', error);
    res.status(500).json({ message: error.message });
  }
}

pubProdReportController.getPublishedProducerReportProducer = async (req, res) => {
  try {
    const { email } = req.query;
    const { id } = req.params;
    const user = await UserService.findUserByEmailAndRole(email, "Productor");
    const report = await PublishedReportService.findPublishedReportProducer(user, id)
    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching published producer report:', error);
    res.status(500).json({ message: error.message });
  }
}

pubProdReportController.getPublishedProducerReports = async (req, res) => {
  try {
    const {email, page, limit, search} = req.query

    const user = await UserService.findUserByEmailAndRoles(email, ["Responsable", "Administrador"]);
    const reports = await PublishedReportService.findPublishedReports(user, page, limit, search);
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching published producer reports:', error);
    res.status(500).json({ message: error.message });
  }
}

pubProdReportController.getPublishedProducerReportsProducer = async (req, res) => {
  try {
    const {email, page, limit, search} = req.query

    const user = await UserService.findUserByEmailAndRole(email, "Productor");
    const reports = await PublishedReportService.findPublishedReports(user, page, limit, search);
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching published producer reports:', error);
    res.status(500).json({ message: error.message });
  }
}

pubProdReportController.loadProducerReportDraft = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let { email, publishedReportId, newAttachmentsDescriptions } = req.body;
    if (!Array.isArray(newAttachmentsDescriptions)) {
      newAttachmentsDescriptions = [newAttachmentsDescriptions];
    }
    const filledDraft = JSON.parse(req.body.filledDraft ?? "");
    const reportFile = req.files["reportFile"]
      ? req.files["reportFile"][0]
      : null;
    const attachments = req.files["attachments"] || [];
    const deletedReport = req.body.deletedReport ?? null;
    const deletedAttachments = req.body.deletedAttachments ?? [];

    attachments.forEach((attachment, index) => {
      attachment.description = newAttachmentsDescriptions[index] || "";
    });

    const nowtime = datetime_now();
    const nowdate = new Date(nowtime.toDateString());

    const user = await UserService.findUserByEmailAndRole(email, "Productor");

    const pubRep = await PublishedReportService.findPublishedReportProducer(user, publishedReportId, session);
    
    console.log("Aquí voy:", pubRep)

    const pubRepDeadlineDate = new Date(pubRep.deadline.toDateString());
    const pubRepStartDate = new Date(pubRep.period.producer_start_date.toDateString());
    if(pubRepDeadlineDate < nowdate || pubRepStartDate > nowdate) {
      throw new Error("The report period is already closed");
    }
    
    const draft = await PublishedReportService.findDraft(pubRep, filledDraft._id,session);
    const path = `${pubRep.period.name}/Informes/Productores/Borradores/${pubRep.report.name}
      /${pubRep.report.producers[0].name}/${draft ? draft.loaded_date.toISOString() 
      : nowtime.toISOString()}`;

    draft?.attachments?.forEach((draftAttachment) => {
      const filledAttachment = filledDraft?.attachments?.find(
        (attachment) => attachment._id.toString() === draftAttachment._id.toString()
      );
      if (filledAttachment) {
        draftAttachment.description = filledAttachment.description;
      }
    });
    await PublishedReportService.upsertReportDraft(pubRep, draft, reportFile, attachments, 
      deletedReport, deletedAttachments, nowtime, path, user, session
    );

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
}

pubProdReportController.sendProducerReport = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, publishedReportId, filledDraftId } = req.body;
    
    await PublishedReportService.sendProductorReportDraft(email, publishedReportId, filledDraftId, datetime_now(), session)

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ status: "Responsible report draft sent" });
  } catch(error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(500).json({
      status: "Error sending responsible report draft",
      error: error.message,
    });
  }
}

pubProdReportController.publishProducerReport = async (req, res) => {
  try {
    const {email, reportId, deadline, period} = req.body;
    await UserService.findUserByEmailAndRoles(email, ["Responsable", "Administrador"]);
    const report = await ProducerReportsService.getReport(reportId);

    await PublishedReportService.publishReport(report, period, deadline)
    res.status(200).json({ message: 'Report succesfully published' });
  } catch (error) {
    console.error('Error publishing producer report:', error);
    res.status(500).json({ message: error.message });
  }
}

pubProdReportController.setFilledReportStatus = async (req, res) => {
  try {
    const { email, reportId, filledRepId, observations } = req.body;

    const user = await UserService.findUserByEmailAndRole(email, "Administrador");

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

module.exports = pubProdReportController;