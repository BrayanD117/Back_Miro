const Dimension = require('../models/dimensions');

const dimensionController = {};

dimensionController.getDimensions = async (req, res) => {
    const dimensions = await Dimension.find();
    res.status(200).json(dimensions);
}

dimensionController.getDimension = async (req, res) => {
    const name = req.body.name;
    const dimension = await Dimension.findOne({name});
    res.status(200).json(dimension);
}

dimensionController.createDimension = async (req, res) => {
    const dimension = new Dimension( req.body )
    await dimension.save();
    res.status(200).json({status: "Dimension created"});
}

module.exports = dimensionController