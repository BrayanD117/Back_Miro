const mongoose = require('mongoose');
const { validate } = require('./reports');
const Schema = mongoose.Schema;

const filledReportSchema = new Schema({
    dimension: {
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
        ref: 'dimensions',
        validate: [
            {
                validator: function (v) {
                    return v.length > 0;
                },
                message: 'At least one dimension is required'
            },
            {
                validator: function (v) {
                    return new Set(v).size === v.length;
                },
                message: 'Dimensions array must not contain duplicates'
            }
        ],
        required: true
    },
    filled_reports: {
        type: [filledReportSchema]
    }

}, {
    versionKey: false,
    timestamps: true
})

module.exports = mongoose.model('publishedReports', publishedReportSchema)