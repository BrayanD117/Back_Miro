const Log = require('../models/logs');

const logController = {}

logController.get = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { 'user.full_name': { $regex: search, $options: 'i' } },
        { 'published_template.name': { $regex: search, $options: 'i' } },
        { 'errors.column': { $regex: search, $options: 'i' } },
      ],
    };

    const totalLogs = await Log.countDocuments(query);

    const logs = await Log.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('published_template', 'name');

    const totalPages = Math.ceil(totalLogs / limit);

    res.status(200).send({
      logs,
      totalPages,
    });
  } catch (e) {
    res.status(500).send();
  }
};

logController.getById = async (req, res) => {
  const _id = req.params.id;
  try {
    const log = await Log.findById(_id);
    if (!log) {
      return res.status(404).send();
    }
    res.send(log);
  }
  catch (e) {
    res.status(500).send();
  }
}

logController.deleteDateRange = async (req, res) => {
  try {
    await Log.deleteMany({
      date: {
        $gte: req.query.startDate,
        $lte: req.query.endDate
      }
    });
    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
}

module.exports = logController;