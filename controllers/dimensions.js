const Dimension = require('../models/dimensions');

const dimensionController = {};

dimensionController.getDimensions = async (req, res) => {
  const dimensions = await Dimension.find();
  res.status(200).json(dimensions);
}

dimensionController.getDimensionsPagination = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  try {
    const query = search
      ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { responsible: { $regex: search, $options: 'i' } }, // Asegúrate de que coincide con el modelo
          { producers: { $regex: search, $options: 'i' } }
        ]
      }
      : {};
    const dimensions = await Dimension.find(query).skip(skip).limit(limit);
    const total = await Dimension.countDocuments(query);

    res.status(200).json({
      dimensions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching dimensions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

dimensionController.createDimension = async (req, res) => {
  try {
    const nameLowerCase = req.body.name.toLowerCase();
    const existingDimension = await Dimension.findOne({ name: nameLowerCase });
    
    if (existingDimension) {
      return res.status(400).json({ error: "La dimensión con ese nombre ya existe" });
    }

    const dimension = new Dimension({
      ...req.body,
      name: nameLowerCase
    });

    await dimension.save();
    res.status(200).json({ status: "Dimension created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

dimensionController.updateDimension = async (req, res) => {
  const { id } = req.params;
  const dimensionData = req.body;

  try {
    const dimension = await Dimension.findByIdAndUpdate(id, dimensionData, { new: true });
    if (!dimension) {
      return res.status(404).json({ error: "Dimension not found" });
    }
    res.status(200).json({ dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

dimensionController.deleteDimension = async (req, res) => {
  const { id } = req.params;

  try {
    const dimension = await Dimension.findByIdAndDelete(id);
    if (!dimension) {
      return res.status(404).json({ error: "Dimension not found" });
    }
    res.status(200).json({ status: "Dimension deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = dimensionController;
