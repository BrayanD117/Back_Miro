const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const driveFile = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    view_link: {
      type: String,
      required: true,
    },
    download_link: {
      type: String,
      required: true,
    },
    folder_id: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
  }
);

const reportSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
    report_example: {
      type: driveFile,
      required: true,
    },
    created_by: {
      type: {},
      required: true,
    },
    deadline: {
      type: Date,
      required: false,
    }
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("producerReports", reportSchema);
