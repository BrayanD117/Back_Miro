const multer = require('multer');
const fs = require('fs');

const Report = require('../models/reports');
const User = require('../models/users');

const reportController = {}

reportController.getReports = async (req, res) => {
    const { email } = req.email;
    try {
        const user = await User.findOne({ email , activeRole: 'Administrador' });
        if (!user) {
            return res.status(403).json({ status: "User not found or isn't an Adminstrator" });
        }
        const reports = await Report.find();
        res.status(200).json(reports);
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error getting reports", error: error.message });
    }
}

reportController.createReport = async (req, res) => {
    const { email } = req.email;
    const { name, description, required_files } = req.body;
    try {
        const user = await User.findOne({ email , activeRole: 'Administrador' });
        if (!user) {
            if (req.file) {
                fs.unlinkSync(req.file.path); // Elimina el archivo en caso de error
            }
            return res.status(403).json({ status: "User not found or isn't an Adminstrator" });
        }
        const newReport = new Report({ name, description, required_files, report_example_path: req.file.path });
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