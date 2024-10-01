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
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).send({ message: 'Las fechas startDate y endDate son requeridas' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).send({ message: 'Formato de fecha inválido' });
  }

  if (start > end) {
    return res.status(400).send({ message: 'startDate no puede ser mayor que endDate' });
  }

  try {
    const result = await Log.deleteMany({
      date: {
        $gte: start,
        $lte: end,
      },
    });

    res.status(200).send({
      message: 'Logs eliminados exitosamente',
      deletedCount: result.deletedCount,
    });
  } catch (e) {
    res.status(500).send({ message: 'Error al eliminar los logs', error: e.message });
  }
};

module.exports = logController;