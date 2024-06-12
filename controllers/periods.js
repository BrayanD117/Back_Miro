const Period = require('../models/periods');

const periodController = {};

periodController.getPeriods = async (req, res) => {
    const periods = await Period.find();
    res.status(200).json(periods);
}

periodController.getPeriod = async (req, res) => {
    const start_date = req.body.start_date;
    const period = await Period.findOne({start_date});
    res.status(200).json(period);
}

periodController.createPeriod = async (req, res) => {
    const period = new Period( req.body );
    await period.save();
    res.status(200).json({status: "Period created"});
}

periodController.updatePeriod = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedPeriod = await Period.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedPeriod) {
            return res.status(404).json({ error: "Period not found" });
        }
        res.status(200).json(updatedPeriod);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

periodController.deletePeriod = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedPeriod = await Period.findByIdAndDelete(id);
        if (!deletedPeriod) {
            return res.status(404).json({ error: "Period not found" });
        }
        res.status(200).json({ message: "Period deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = periodController