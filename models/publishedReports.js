const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const filledReportSchema = new Schema({
    dimension_sender: {
        type: Schema.Types.ObjectId,
        ref: 'dimensions',
        required: true
    },
    send_by: {
        type: {},
        required: true
    },
    loaded_date: {
        type: Date,
        required: true,
    },
    sended_files_path: {
        type: [String],
        required: true
    }

}, {
    _id: false,
    versionKey: false,
    timestamps: true
});

const publishedReportSchema = new Schema({
    report: {
        type: {},
        required: true
    },
    period: {
        type: Schema.Types.ObjectId,
        ref: 'periods',
        required: true
    },
    dimensions: {
        type: [Schema.Types.ObjectId],
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Enviado', 'Pendiente', 'Aprobado', 'Rechazado']
    },
    filled_reports: {
        type: [filledReportSchema],
        required: true
    }

}, {
    versionKey: false,
    timestamps: true
})

module.exports = mongoose.model('publishedReports', publishedReportSchema)