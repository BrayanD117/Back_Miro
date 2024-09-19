const Log = require('../models/logs');

const logController = {}

logController.create = async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    res.status(201).send({ log });
  } catch (e) {
    res.status(400).send(e);
  }
}

logController.get = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const search = req.query.search;
    const skip = (page - 1) * limit;

    const logs = await Log.find({
      $or: [
        { message: { $regex: search, $options: 'i' } },
        { 'user.full_name': { $regex: search, $options: 'i' } }
      ]
    }).sort({ date: -1 }).skip(skip).limit(limit)
    .populate('published_template', 'name');

    res.status(201).send(logs);
  } catch (e) {
    res.status(500).send();
  }
}

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