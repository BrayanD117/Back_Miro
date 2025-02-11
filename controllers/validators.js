const { register } = require('module');
const User = require('../models/users')
const Validator = require('../models/validators');
const Student = require('../models/students');
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
        const { id } = req.body;
        const validator = await Validator.findById(id);
        if (!validator) {
            return res.status(404).json({ status: "Validator not found" })
        }
        if (req.body.name && req.body.name.includes('-')) {
            return res.status(400).json({ 
                status: "The new name cannot contain the '-' character" 
            });
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
        const { email, page = 1, limit = 10, search = '' } = req.query;

        // Buscar usuario activo por email
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(404).json({ status: "User not found" });
        }
        
        // Crear filtro de búsqueda para todos los campos del validador
        const searchFilter = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { otherField1: { $regex: search, $options: 'i' } }, // Añade aquí los campos que desees incluir en la búsqueda
                    { otherField2: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        // Obtener la lista de validadores con paginación y filtro de búsqueda
        const validators = await Validator.find(searchFilter)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        // Obtener el total de documentos para calcular páginas totales
        const totalValidators = await Validator.countDocuments(searchFilter);

        res.status(200).json({
            validators,
            currentPage: Number(page),
            totalPages: Math.ceil(totalValidators / limit),
            totalValidators
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


validatorController.getValidatorOptions = async (req, res) => {
    try {
        const options = [
          { name: 'Funcionarios - Identificación', type: 'Entero' }, 
          { name: 'Estudiantes - Codigo', type: 'Texto Corto' },
          { name: 'Estudiantes - Identificación', type: 'Texto Corto' }
        ];

        const validators = await Validator.find({}, {name: 1, columns: 1});
        
        const result = validators.flatMap(validator => 
            validator.columns
                .filter(column => column.is_validator)
                .map(column => ({ name: `${validator.name} - ${column.name}`, type: column.type }))
        );

        options.push(...result)

        res.status(200).json({ options })
    } catch (error) {
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
            pages: Math.ceil(totalCount / limit),
            currentPage: Number(page),
            totalValidators: totalCount,
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
    let result = { status: true, column: name, errors: [] };

    if (!name || !datatype || !values) {
        return { status: false, errors: [{ register: null, message: 'Missing column name, datatype, or values' }] };
    }

    let validator = null;
    let columnToValidate = null;
    let validValuesSet = null;

    if (validate_with) {
        const [validatorName, columnName] = validate_with.split(' - ');

        if (validatorName === "Funcionarios") {
            // Obtener identificaciones de todos los usuarios
            const users = await User.find({}, { identification: 1 }).lean();
            const userIdentifications = users.map(user => user.identification);
            validValuesSet = new Set(userIdentifications);
            columnToValidate = { type: "Entero", values: userIdentifications }; // Ajusta según sea necesario
        }
        else if (validatorName === "Estudiantes") {
            // Obtener códigos de todos los estudiantes
            if(columnName === "Codigo") {
              const students = await Student.find({}, { code_student: 1 }).lean();
              const studentCodes = students.map(student => student.code_student);
              validValuesSet = new Set(studentCodes);
              columnToValidate = { type: "Texto Corto", values: studentCodes };
            } else {
              const students = await Student.find({}, { identification: 1 }).lean();
              const studentIdentifications = students.map(student => student.identification);
              validValuesSet = new Set(studentIdentifications);
              columnToValidate = { type: "Texto Corto", values: studentIdentifications };
            }
        } else {
            validator = await Validator.findOne({ name: validatorName });

            if (!validator) {
                return { status: false, errors: [{ register: null, message: `Tabla de validación no encontrada: ${validatorName}` }] };
            }

            columnToValidate = validator.columns.find(column => column.name === columnName);

            if (!columnToValidate) {
                return { status: false, errors: [{ register: null, message: `Columna '${columnName}' no encontrada en la tabla: ${validatorName}` }] };
            }

            validValuesSet = new Set(columnToValidate.values);
        }
    }

    values.forEach((value, index) => {
        if (required && (value.length === 0 || value === null || value === undefined)) {
            result.status = false;
            result.errors.push({
                register: index + 1,
                message: `Valor vacío encontrado en la columna ${name}, fila ${index + 2}`,
                value: value
            });
            return; // Continúa con el siguiente valor
        }

        const validation = allowedDataTypes[datatype](value);
        if (!validation.isValid) {
            result.status = false;
            result.errors.push({
                register: index + 1,
                message: `Valor inválido encontrado en la columna ${name}, fila ${index + 2}: ${validation.message}`,
                value: value
            });
        }

        if (columnToValidate) {
            if ((columnToValidate.type === "Texto" && typeof value !== "string") ||
                (columnToValidate.type === "Numero" && typeof value !== "number")) {
                result.status = false;
                result.errors.push({
                    register: index + 1,
                    message: `Valor de la columna ${name}, fila ${index + 2} no es del tipo ${columnToValidate.type}`,
                    value: value
                });
            }

            if (!validValuesSet.has(value)) {
                result.status = false;
                result.errors.push({
                    register: index + 1,
                    message: `Valor de la columna ${name}, fila ${index + 2} no fue encontrado en la validación: ${validate_with}`,
                    value: value
                });
            }
        }
    });

    return result;
};


validatorController.giveValidatorToExcel = async (name) => {
    try {
        name = name.split(' - ')[0];
        const validator = await Validator.findOne({ name });

        if (!validator) {
            console.log(`Validator with name ${name} not found`);
            return;
        }

        // Asegúrate de inicializar acc como un array de objetos vacíos
        const validatorFilled = {}

        validatorFilled['name'] = name
        
        validatorFilled['values'] = validator.columns.reduce((acc, item) => {
            item.values.forEach((value, index) => {
                // Inicializar el objeto si no existe
                if (!acc[index]) {
                    acc[index] = {};
                }
                acc[index][item.name] = value.$numberInt || value;
            });
            return acc;
        }, []);

        return validatorFilled;

    } catch (error) {
        console.log(error);
        return;
    }
}

validatorController.getAllValidators = async (req, res) => {
    try {
      const validators = await Validator.find({});
      res.status(200).json({ validators });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

module.exports = validatorController