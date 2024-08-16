const fs = require('fs');

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
                    { title: { $regex: search, $options: 'i' } },  // 'i' para insensible a mayúsculas
                    { description: { $regex: search, $options: 'i' } },
                    { createdBy: { $regex: search, $options: 'i' } }, // Suponiendo que 'createdBy' es un campo de string
                    // Agrega más campos según sea necesario
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
    try {
        const { email } = req.body;
        const { name, description, required_files } = req.body;
        const user = await User.findOne({ email , activeRole: 'Administrador' });
        if (!user) {
            if (req.file) {
                fs.unlinkSync(req.file.path); // Elimina el archivo en caso de error
            }
            return res.status(403).json({ status: "User not found or isn't an Adminstrator" });
        }
        const newReport = new Report({ name, description, required_files, report_example_path: req.file.path, creator: email });
        await newReport.save();
        res.status(201).json({ status: "Report created" });
    } catch (error) {
        console.log(error);
        if (req.file) {
            fs.unlinkSync(req.file.path); // Elimina el archivo en caso de error
        }
        res.status(500).json({ status: "Error creating report", error: error.message });
    }
}

module.exports = reportController;