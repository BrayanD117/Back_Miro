const Period = require('../models/periods');
const UserService = require('../services/users');

const periodController = {};

periodController.getPeriods = async (req, res) => {
  try {
    const email = req.query.email;
    await UserService.findUserByEmailAndRole(email, "Administrador");
    const periods = await Period.find();
    res.status(200).json(periods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Error getting periods", error: error.message });
  }
}

periodController.getPeriodsPagination = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    try {
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }
            ];

            if (search.toLowerCase() === 'activo' || search.toLowerCase() === 'inactivo') {
                query.$or.push({ is_active: search.toLowerCase() === 'activo' });
            }
        }

        const periods = await Period.find(query).skip(skip).limit(limit);
        const total = await Period.countDocuments(query);

        res.status(200).json({
            periods,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching periods:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

periodController.getPeriod = async (req, res) => {
    const start_date = req.body.start_date;
    const period = await Period.findOne({ start_date });
    res.status(200).json(period);
}

periodController.createPeriod = async (req, res) => {
    const period = new Period(req.body);
    await period.save();
    res.status(200).json({ status: "Period created" });
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

periodController.getActivePeriods = async (req, res) => {
    try {
        const periods = await Period.find();
        res.status(200).json(periods);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = periodController;
