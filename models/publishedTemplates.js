const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./users.js')
const Dependency = require('./dependencies.js')
const Template = require('./templates.js')

const filled_fields = new Schema({
    field_name: {
        type: Schema.Types.String,
        ref: 'templates.fields',
        required: true
    },
    values: {
        type: [{}],
        required: true
    }
}, {
    _id: false
})

const producersData = new Schema({
    dependency: {
        type: Schema.Types.String,
        ref: 'dependencies',
        required: true
    },
    send_by: {
        type: {},
        required: true
    },
    filled_data: [filled_fields]
}, {
    _id: false
})

const publishedTemplateSchema = new Schema({
    name: String,
    published_by: {
        type: User.schema,
        required: true
    },
    template: {},
    period: {
        type: Schema.Types.ObjectId,
        ref: 'periods',
        required: true
    },
    producers_dep_code: {
        type: [String],
        required: true
    },
    loaded_data: [producersData],
    completed: {
        type: Boolean,
        default: false
    }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model('publishedTemplates', publishedTemplateSchema);