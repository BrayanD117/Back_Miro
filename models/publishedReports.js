const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const driveFile = new Schema(
  {
    id: {
      type: String,
      required: true,
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
    comments: {
      type: String,
    }
  },
  {
    _id: false,
    versionKey: false,
  }
);

const filledReportSchema = new Schema(
  {
    dimension: {
      type: Schema.Types.ObjectId,
      ref: "dimensions",
      required: true,
    },
    send_by: {
      type: {},
      required: true,
    },
    loaded_date: {
      type: Date,
      required: true,
    },
    report_file: {
      type: driveFile
    },
    attachments: {
      type: [driveFile],
    },
    status: {
      type: String,
      enum: ["En Borrador", "En Revisión", "Aprobado", "Rechazado"],
      default: "En Borrador",
    },
    folder_id: {
      type: String
    },
    //TODO Improve for required
    status_date: {
      type: Date,
      required: true,
    },
    evaluated_by: {
      type: {}
    },
    observations: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const publishedReportSchema = new Schema(
  {
    report: {
      type: {},
      required: true,
    },
    period: {
      type: Schema.Types.ObjectId,
      ref: "periods",
      required: true,
    },
    dimensions: {
      type: [Schema.Types.ObjectId],
      ref: "dimensions",
      validate: [
        {
          validator: function (v) {
            return v.length > 0;
          },
          message: "At least one dimension is required",
        },
      ],
      required: true,
    },
    filled_reports: {
      type: [filledReportSchema],
    },
    folder_id: String,
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("publishedReports", publishedReportSchema);
