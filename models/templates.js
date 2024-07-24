const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define los tipos de datos permitidos
const allowedDataTypes = [
    "Entero",
    "Decimal",
    "Porcentaje",
    "Texto Corto",
    "Texto Largo",
    "True/False",
    "Fecha",
    "Fecha Inicial / Fecha Final",
    "Link"
];

// Define la función de validación personalizada
function validateDataType(value) {
    return allowedDataTypes.includes(value);
}

// Define el esquema para el campo
const fieldSchema = new Schema({
    name: { 
        type: String,
        required: true,
        unique: true
    },
    datatype: { 
        type: String, 
        required: true,
        validate: [validateDataType, "Invalid datatype"] // Usa la función de validación
    },
    required: {
        type: Boolean,
        required: true
    },
    validate_with: {
        type: String,
        required: false
    }, // Referencia a otra colección para validación
    comment: {
        type: String,
        required: false
    } // Campo para comentarios
}, {
    _id: false,
    versionKey: false
});

// Define el esquema para la plantilla principal
const templateSchema = new Schema({
    name: { 
        type: String, 
        required: true,
        unique: true  // Asegura que el nombre de la plantilla sea único
    },
    file_name: {
        type: String,
    },
    file_description: { 
        type: String,
    },
    fields: {
        type: [fieldSchema],
        required: true
    }, // Array de campos
    active: {
        type: Boolean,
        default: true,
        required: true
    },
    created_by: {
        type: {},
        required: true
    },
    dimension: {
        type: Schema.Types.ObjectId,
        ref: 'dimensions',
    }
}, 
{
    versionKey: false,
    timestamps: true
}
); // Nombre de la colección en la base de datos

module.exports = mongoose.model('templates', templateSchema);
