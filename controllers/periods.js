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

module.exports = periodController