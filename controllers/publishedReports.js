const PubReport = require('../models/publishedReports');
const Report = require('../models/reports');
const User = require('../models/users');
const Period = require('../models/periods');
const Dimension = require('../models/dimensions');

const pubReportController = {};

pubReportController.getPublishedReports = async (req, res) => {
    try {
        console.log("Llegué", req.query);
        const { email, page = 1, limit = 10, search = '' } = req.query;

        // Verificar si el usuario es un administrador o Productor activo
        const user = await User.findOne({ 
            email, 
            activeRole: { $in: ['Administrador', 'Productor'] }, 
            isActive: true 
        });
        if (!user) {
            return res.status(403).json({ status: "User not found or isn't an Administrator or Producer" });
        }

        // Configurar paginación
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const skip = (pageNumber - 1) * pageSize;

        // Crear objeto de búsqueda
        const searchQuery = search.trim()
            ? {
                $or: [
                    { 'report.name': { $regex: search, $options: 'i' } }, // Busca en el campo "report.name"
                    { 'period.name': { $regex: search, $options: 'i' } } // Busca en el campo "period.name"
                ]
            }
            : {};

        const publishedReports = await PubReport.find(searchQuery)
            .skip(skip)
            .limit(pageSize)
            .populate('period')
            .populate({
                path: 'dimensions',
                select: 'name responsible'
            })
            .exec();

        const totalReports = await PubReport.countDocuments(searchQuery);

        // Responder con los datos paginados y la información de paginación
        res.status(200).json({
            total: totalReports,
            page: pageNumber,
            limit: pageSize,
            totalPages: Math.ceil(totalReports / pageSize),
            publishedReports
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error getting published reports", error: error.message });
    }
}


pubReportController.getPublishedReport = async (req, res) => {
    const { id } = req.params;
    try {
        const publishedReport = await PubReport.findById(id)
        if (!publishedReport) {
            return res.status(404).json({ status: "Published Report not found" });
        }
        res.status(200).json(publishedReport);
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error getting published report", error: error.message });
    }
}

pubReportController.publishReport = async (req, res) => {
    const { reportId, periodId, dimensionsId } = req.body;
    try {
        const report = await Report.findById(reportId)
        if (!report) {
            return res.status(404).json({ status: "Report not found" });
        }
        const publishedReport = new PubReport({
            report,
            period: periodId,
            dimensions: dimensionsId
        });
        await publishedReport.save();
        res.status(200).json({ status: "Published Report created" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error creating published report", error: error.message });
    }
}

pubReportController.feedOptionsForPublish = async (req, res) => {
    try {
        const email = req.query.email;
        const user = await User.findOne({ email, isActive: true, activeRole: 'Administrador' });
        if (!user) {
            return res.status(403).json({ status: "User not found or isn't an active administrator" });
        }
        //TODO FILTER ONLY ACTIVE PERIODS
        const periods = await Period.find({is_active: true}).select('name');
        const dimensions = await Dimension.find({}).select('name');
        res.status(200).json({ periods, dimensions });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error getting feed options", error: error.message });
    }
}

module.exports = pubReportController;