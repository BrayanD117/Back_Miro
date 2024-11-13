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
    },
    requires_attachment: {
      type: Boolean,
      required: true
    },
    created_by: {
      type: {},
      required: true,
    },
    dimensions: {
      type: [Schema.Types.ObjectId],
      ref: "dimensions",
      required: true,
      validate: {
        validator: function(v) {
          return v.length > 0;
        } 
      }
    },
    producers: {
      type: [Schema.Types.ObjectId],
      ref: "dependencies",
      required: true,
      validate: {
        validator: function(v) {
          return v.length > 0;
        } 
      }
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("producerReports", reportSchema);
