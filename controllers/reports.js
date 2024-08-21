const fs = require('fs');
const { uploadFileToGoogleDrive }  = require('../config/driveUpload');

const Report = require('../models/reports');
const User = require('../models/users');

const reportController = {}

reportController.getReports = async (req, res) => {
    try {
        const { email, page = 1, limit = 10, search = '' } = req.query;

        // Verificar si el usuario es un administrador activo
        const user = await User.findOne({ email, activeRole: 'Administrador' });
        if (!user) {
            return res.status(403).json({ status: "User not found or isn't an Administrator" });
        }

        // Convertir los parámetros a números y calcular el salto de documentos
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const skip = (pageNumber - 1) * pageSize;

        // Crear el filtro de búsqueda, buscando en todas las columnas relevantes
        const searchQuery = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },  // 'i' para insensible a mayúsculas
                    { description: { $regex: search, $options: 'i' } },
                    { 'created_by.email': { $regex: search, $options: 'i' } }, // Búsqueda en el email del creador
                ]
            }
            : {};

        // Obtener los reportes con el filtro de búsqueda y paginación
        const reports = await Report.find(searchQuery).skip(skip).limit(pageSize);

        // Obtener el total de documentos que coinciden con la búsqueda
        const totalReports = await Report.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalReports / pageSize);

        res.status(200).json({
            reports,
            currentPage: pageNumber,
            totalPages,
            totalReports
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error getting reports", error: error.message });
    }
};


reportController.createReport = async (req, res) => {
    const session = await Report.startSession();
    session.startTransaction();

    try {
        const { email } = req.body;
        const { name, description, requires_attachment } = req.body;
        const user = await User.findOne({ email, activeRole: 'Administrador' });

        if (!user || user.activeRole !== 'Administrador') {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ status: "User not found or isn't an Administrator" });
        }

        if (!req.file) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ status: "No file attached" });
        }
        // Crea el informe pero aún no lo guarda en la base de datos
        const newReport = new Report({ 
            name, 
            description, 
            requires_attachment,
            created_by: user 
        });
        await newReport.save({ session });
        
        const destinationPath = `Reportes/Formatos/${req.file.originalname}`
        const fileData = await uploadFileToGoogleDrive(req.file, destinationPath)
        newReport.report_example_id = fileData.id;
        newReport.report_example_link = fileData.webViewLink;
        await newReport.save({ session })
        // Si la subida del archivo tiene éxito, actualiza el informe con el fileId
        fs.unlinkSync(req.file.path)
        // Confirma la transacción
        await session.commitTransaction()
        session.endSession()

        res.status(201).json({ status: "Report created" });

    } catch (error) {
        console.log(error);

        // En caso de error, deshacer la transacción
        await session.abortTransaction();
        session.endSession();

        if (req.file) {
            fs.unlinkSync(req.file.path); // Elimina el archivo en caso de error
        }

        res.status(500).json({ status: "Error creating report", error: error.message });
    }
}

reportController.getReportExampleFile = async (req, res) => {
    const { id } = req.params;
    try {
        console.time('getDriveFile')
        const link = await generateTemporaryLink(id)
        console.timeEnd('getDriveFile')
        res.status(200).json({ link });
    } catch (error) {
        res.status(500).json({ status: "Error getting file", error: error.message });
    }
}

module.exports = reportController;