const mongoose = require('mongoose')

const periodSchema = new mongoose.Schema({

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
    }
},
{
    versionKey: false,
    timestamps: true
}
);

module.exports = mongoose.model('periods', periodSchema);