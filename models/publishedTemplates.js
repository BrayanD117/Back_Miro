const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = requires('./users.js')
const Dependency = requires('./dependencies.js')
const Template = requires('./templates.js')

const filled_fields = new Schema({
    id: Schema.Types.ObjectId,
    values: [{}]
})

const producersData = new Schema({
    dependency: Dependency,
    user_sender: User,
    filled_data: [filled_fields]
})

const publishedTemplateSchema = new Schema({
    template: Template,
    period: Schema.Types.ObjectId,
    producers_dep_code: {
        type: [String],
        required: true
    },
    dimension_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    loaded_data: producersData,
    completed: {
        type: Boolean,
        default: false
    }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model('publishedTemplates', publishedTemplateSchema);