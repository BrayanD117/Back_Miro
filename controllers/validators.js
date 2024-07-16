const Validator = require('../models/validators')

const validatorController = {}

validatorController.createValidator = async (req, res) => {
    try {
        const validator = new Validator(req.body)
        await validator.save()
        res.status(200).json({ status: "Validator created" })

    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
}

validatorController.updateValidator = async (req, res) => {
