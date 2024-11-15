const ProducerReportsService = require("../services/producerReports");
const PublishedReportService = require("../services/publishedProducerReports");
const UserService = require("../services/users");


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

module.exports = pubProdReportController;