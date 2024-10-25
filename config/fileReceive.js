const multer = require("multer");
const os = require("os");

const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  //50 MB limit size
  limits: {
    fileSize: 1024 * 1024 * 50,
  },
});

module.exports = fileUpload;
