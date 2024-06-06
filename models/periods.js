const mongoose = require('mongoose')

const periodSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        unique: true
    },
    start_date: {
        type: Date,
        required: true,
    },
    end_date: {
        type: Date,
        required: true,
    },
    collect_start_date: {
        type: Date,
        required: true,
    },
    collect_end_date: {
        type: Date,
        required: true,
    },
    upload_start_date: {
        type: Date,
        required: true,
    },
    upload_end_date: {
        type: Date,
        required: true,
    },
    is_active: {
        type: Boolean,
        default: false,
    }
},
{
    versionKey: false,
    timestamps: true
}
);

module.exports = mongoose.model('periods', periodSchema);