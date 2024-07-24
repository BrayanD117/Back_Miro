const { register } = require('module');
const User = require('../models/users')
const Validator = require('../models/validators');
const { all } = require('../routes/users');

const validatorController = {}

const allowedDataTypes = {
    "Entero": (value) => {
        const isValid = Number.isInteger(value);
        return {
            isValid,
            message: isValid ? null : "El valor no es un entero."
        };
    },
    "Decimal": (value) => {
        const isValid = typeof value === 'number' && !Number.isNaN(value);
        return {
            isValid,
            message: isValid ? null : "El valor no es un decimal."
        };
    },
    "Porcentaje": (value) => {
        const isValid = typeof value === 'number' && value >= 0 && value <= 100;
        return {
            isValid,
            message: isValid ? null : "El valor no es un porcentaje válido (0-100)."
        };
    },
    "Texto Corto": (value) => {
        const isValid = typeof value === 'string' && value.length <= 30;
        return {
            isValid,
            message: isValid ? null : "El valor no es un texto corto (máximo 30 caracteres)."
        };
    },
    "Texto Largo": (value) => {
        const isValid = typeof value === 'string' && value.length <= 500;
        return {
            isValid,
            message: isValid ? null : "El valor no es un texto largo (máximo de 500 caracteres)."
        };
    },
    "True/False": (value) => {
        const isValid = typeof value === 'boolean';
        return {
            isValid,
            message: isValid ? null : "El valor no es un booleano (true/false)."
        };
    },
    "Fecha": (value) => {
        const isValid = !isNaN(Date.parse(value));
        return {
            isValid,
            message: isValid ? null : "El valor no es una fecha válida."
        };
    },
    "Fecha Inicial / Fecha Final": (value) => {
        const isValid = Array.isArray(value) && value.length === 2 && !isNaN(Date.parse(value[0])) && !isNaN(Date.parse(value[1]));
        return {
            isValid,
            message: isValid ? null : "El valor no es un rango de fechas válido (Fecha Inicial y Fecha Final)."
        };
    },
    "Link": (value) => {
        const isValid = typeof value === 'string' && /^(https?:\/\/[^\s]+)$/.test(value);
        return {
            isValid,
            message: isValid ? null : "El valor no es un enlace válido."
        };
    }
};

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

validatorController.getValidator = async (req, res) => {
    const { name } = req.query
    try {
        const validator = await Validator
            .findOne({name})
        if (!validator) {
            return res.status(404).json({ status: "Validator not found" })
        }
        res.status(200).json({ validator })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

validatorController.getValidatorById = async (req, res) => {
    const { id } = req.query
    try {
        const validator = await Validator
            .findById(id)
        if (!validator) {
            return res.status(404).json({ status: "Validator not found" })
        }
        res.status(200).json({ validator })
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

validatorController.getValidatorsWithPagination = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const query = search ? { name: { $regex: search, $options: 'i' } } : {};

        const validators = await Validator.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .exec();

        const totalCount = await Validator.countDocuments(query);

        res.status(200).json({
            validators,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

validatorController.deleteValidator = async (req, res) => {
    try {
        const { id } = req.body;
        await Validator.findByIdAndDelete(id);
        res.status(200).json({ status: "Validator deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

validatorController.validateColumn = async (column) => {
    const { name, datatype, values, validate_with, required } = column;
    let result = { status: true, column, errors: [] }; // Inicializa el objeto result correctamente

    if (!name || !datatype || !values) {
        return { status: false, errors: [{ register: null, message: 'Missing column name, datatype, or values' }] };
    }

    for (const [index, value] of values.entries()) { // Usa entries() para acceder tanto al índice como al valor
        if (required && (value.length === 0 || value === null || value === undefined)) {
            result.status = false;
            result.column = name;
            result.errors.push({
                register: index + 1,
                message: `Valor vacío encontrado en la columna ${name}, fila ${index + 2}`
            });
        }

        const validation = allowedDataTypes[datatype](value);
        if (!validation.isValid) {
            result.status = false;
            result.column = name;
            result.errors.push({
                register: index + 1,
                message: `Valor inválido encontrado en la columna ${name}, fila ${index + 2}: ${validation.message}`
            });
        }

        if (validate_with) {
            const [validatorName, columnName] = validate_with.split(' - ');
            const validator = await Validator.findOne({ name: validatorName });
            if (!validator) {
                result.status = false;
                result.column = name;
                result.errors.push({
                    register: index + 1,
                    message: `Tabla de validación no encontrada: ${validatorName}`
                });
                continue; // Continúa con el siguiente valor si el validador no se encuentra
            }

            const column = validator.columns.find(column => column.name === columnName);
            //TODO VERIFICAR QUE COLUMN TENGA IS_VALIDATOR EN TRUE
            if (!column) {
                result.status = false;
                result.column = name;
                result.errors.push({
                    register: index + 1,
                    message: `Columna '${columnName}' no encontrada en la tabla: ${validatorName}`
                });
                continue;
            }

            if (!column.values.includes(value)) {
                result.status = false;
                result.column = name;
                result.errors.push({
                    register: index + 1,
                    message: `Valor de la columna ${name}, fila ${index + 2} no fue encontrado en la validacion: ${validate_with}`
                });
            }
        }
    }

    return result;
};


module.exports = validatorController