const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const columnSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    is_validator: {
        type: Boolean,
        required: true,
        default: false
    },
    type: {
        type: String,
        required: true
    },
    values: {
        type: [{}],
        required: true
    }
}, {
    _id: false,
    versionKey: false,
    timestamps: true
})

const validatorTemplate = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    columns: {
        type: [columnSchema],
        required: true,
        validate: {
            validator: (columns) => {
                if (!columns || columns.length === 0) return true;
                const length = columns[0].values.length;
                return columns.every(column => column.values.length === length);
            },
            message: 'All columns must have values arrays of the same length.'
        }
    }
}, {
    versionKey: false,
    timestamps: true
})

module.exports = mongoose.model('validators', validatorTemplate)