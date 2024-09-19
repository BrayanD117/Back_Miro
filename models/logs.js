const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./users");

const ErrorDescription = new Schema({
  register: {
    type: Number,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  }
}, {
  _id: false
});

const Error = new Schema({
  column: {
    type: String,
    required: true,
  },
  description: {
    type: ErrorDescription,
    required: true,
  },
}, {
  _id: false
});

const logSchema = new mongoose.Schema(
  {
    user: {
      type: User.schema,
      required: true,
    },
    published_template: {
      type: Schema.Types.ObjectId,
      ref: "publishedTemplates",
      required: true,
    },
    date: {
      type: Date,
      required: true
    },
    errors: {
      type: Error,
      required: true
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("logs", logSchema);