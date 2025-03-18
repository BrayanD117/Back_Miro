const mongoose = require("mongoose");
const User = require("./users");
const Dependency = require("./dependencies");
const Student = require("./students");
const Validator = require("./validators");

const periodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    producer_start_date: {
      type: Date,
      required: true,
    },
    producer_end_date: {
      type: Date,
      required: true,
    },
    responsible_start_date: {
      type: Date,
      required: true,
    },
    responsible_end_date: {
      type: Date,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    screenshot: {
      users: {
        type: [User.schema],
        default: [],
      },
      dependencies: {
        type: [Dependency.schema],
        default: [],
      },
      students: {
        type: [Student.schema],
        default: [],
      },
      validators: {
        type: [Validator.schema],
        default: [],
      },
    },
    screenshot_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("periods", periodSchema);
