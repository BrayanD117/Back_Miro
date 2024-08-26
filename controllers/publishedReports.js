const PubReport = require('../models/publishedReports');
const Report = require('../models/reports');
const User = require('../models/users');
const Period = require('../models/periods');
const Dimension = require('../models/dimensions');
const { uploadFileToGoogleDrive, uploadFilesToGoogleDrive }  = require('../config/driveUpload');

const pubReportController = {};

const datetime_now = () => {
    const now = new Date();

    const offset = -5; // GMT-5
    return new Date(now.getTime() + offset * 60 * 60 * 1000);
}

pubReportController.getPublishedReports = async (req, res) => {
    try {
        const { email, page = 1, limit = 10, search = '' } = req.query;

        // Verificar si el usuario es un administrador o Productor activo
        const user = await User.findOne({
            email,
            activeRole: { $in: ['Administrador'] }, 
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

pubReportController.getPublishedReportsResponsible = async (req, res) => {
    try {
        const { email, page = 1, limit = 10, search = '' } = req.query;

        // Verificar si el usuario es un administrador o Productor activo
        const user = await User.findOne({ 
            email, 
            activeRole: { $in: ['Responsable'] }, 
            isActive: true 
        });
        if (!user) {
            return res.status(403).json({ status: "User not found or isn't Responsible" });
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
                select: 'name responsible',
                match: { responsible: email }
            })
            .exec();

            
        //Gives only reports that the dimension haven't uploaded yet
        const publishedReportsFilter = publishedReports.filter(report => 
            report.filled_reports.filter(
                filledRep => dimensions.includes(filledRep.dimension)).length === 0
            );
        
        const totalReports = publishedReports.length;
        //const publishedReportsFilter = publishedReports.filter(report => report.filled_reports.dim);
        // Responder con los datos paginados y la información de paginación
        res.status(200).json({
            total: totalReports,
            page: pageNumber,
            limit: pageSize,
            totalPages: Math.ceil(totalReports / pageSize),
            publishedReports: publishedReportsFilter
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

pubReportController.loadResponsibleReport = async (req, res) => {
    try {
        const { email, reportId } = req.body;
        const reportFile = req.files['reportFile'] ? req.files['reportFile'][0] : null;
        const attachments = req.files['attachments'] || [];

        const user = await User.findOne({ email, isActive: true, activeRole: 'Responsable' });
        if (!user) {
            return res.status(403).json({ status: "User not found or isn't an active responsible" });
        }
        const publishedReport = await PubReport.findById(reportId).populate('period');
        if (!publishedReport) {
            return res.status(404).json({ status: "Published Report not found" });
        }
        if(publishedReport.period.responsible_start_date >= datetime_now() && publishedReport.period.responsible_end_date <= datetime_now()){
            return res.status(403).json({ status: "Period is closed for reports uploading" });
        }
        const dimension = await Dimension.findOne({ responsible: email });
        console.log(dimension._id);
        if(publishedReport.filled_reports.some(filledReport => filledReport.dimension.equals(dimension._id))) {
            return res.status(403).json({ status: "Dimension already uploaded report" });
        }

        if(!reportFile) {
            return res.status(400).json({ status: "No file attached" });
        }
        if(publishedReport.report.requieres_attachment && attachments.length === 0) {
            return res.status(400).json({ status: "No attachments attached & are required" });
        }
        const [reportFileDataHandle, attachmentsDataHandle] = await Promise.all([
            uploadFileToGoogleDrive(reportFile, `Reportes/${publishedReport.period.name}/${publishedReport.report.name}/${dimension.name}`, reportFile.originalname),
            publishedReport.report.requieres_attachment && attachments.length > 0 
                ? uploadFilesToGoogleDrive(attachments, `Reportes/${publishedReport.period.name}/${publishedReport.report.name}/${dimension.name}/Anexos`)
                : Promise.resolve([]) // Si no se requieren adjuntos o no hay archivos adjuntos, devuelve una promesa resuelta con un array vacío
        ]);
    
        // Procesa los datos del archivo del reporte
        const reportFileData = {
            id: reportFileDataHandle.id,
            name: reportFileDataHandle.name,
            view_link: reportFileDataHandle.webViewLink,
            download_link: reportFileDataHandle.webContentLink,
            folder_id: reportFileDataHandle.parents[0],
        };
    
        // Procesa los datos de los archivos adjuntos si los hay
        const attachmentsData = attachmentsDataHandle.map(attachment => ({
            id: attachment.id,
            name: attachment.name,
            view_link: attachment.webViewLink,
            download_link: attachment.webContentLink,
            folder_id: attachment.parents[0],
        }));

        publishedReport.filled_reports.push({
            dimension: dimension._id,
            send_by: user,
            loaded_date: datetime_now(),
            report_file: reportFileData,
            attachments: attachmentsData
        });
        await publishedReport.save();
            res.status(201).json({ status: "Responsible report loaded" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error loading responsible report", error: error.message });
    }
}

module.exports = pubReportController