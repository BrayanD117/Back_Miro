const User = require('../models/users')
const Validator = require('../models/validators')

const validatorController = {}

validatorController.createValidator = async (req, res) => {
    try {
        console.log(req.body);
        
        if(req.body.name.includes('-')) {
            return res.status(400).json({ status: "Name cannot contain '-' character" });
        }

        if(req.body.columns.some(column => column.name.includes('-'))) {
            return res.status(400).json({ status: "Columns name cannot contain '-' character" });
        }

        const validator = new Validator(req.body);
        await validator.save();
        res.status(200).json({ status: "Validator created" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

validatorController.updateName = async (req, res) => {
    try {
        const { name } = req.body
        const { newName } = req.body
        const validator = await Validator.findOne({name})

        if(name.includes('-') || newName.includes('-')) {
            return res.status(400).json({ status: "New name cannot contain '-' character" })
        }

        if (!validator) {
            return res.status(404).json({ status: "Validator not found" })
        }
        await Validator.updateOne({ name }, { name: newName })        
        res.status(200).json({ status: "Name updated" })
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
}

validatorController.updateValidator = async (req, res) => {
    try {
        const { name } = req.body
        const validator = await Validator.findOne({name}, 'name')
        if (!validator) {
            return res.status(404).json({ status: "Validator not found" })
        }
        validator.set(req.body)
        await validator.save()      
        res.status(200).json({ status: "Validator updated" })
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
}

validatorController.getValidators = async (req, res) => {
    try {
        const options = ['Funcionarios - Identificación']

        const validators = await Validator.find({}, {name: 1, columns: 1})
        
        const result = validators.flatMap(validator => 
            validator.columns
                .filter(column => column.is_validator)
                .map(column => `${validator.name} - ${column.name}`)
        );

        options.push(...result)

        res.status(200).json({ options })
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
}

validatorController.validate = async (req, res) => {
    const { option } = req.query
    const [validatorName, columnName] = option.split(' - ')

    try {
        const validator = await Validator.findOne({name: validatorName})
        if (!validator) {
            return res.status(404).json({ status: "Validator not found" })
        }
    
        const column = validator.columns.find(column => column.name === columnName)
        if (!column) {
            return res.status(404).json({ status: "Column not found" })
        }
    
        res.status(200).json({ column })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = validatorController