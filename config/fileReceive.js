const multer = require("multer");
const path = require("path");

const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '/home/miro/uploads');
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

module.exports = fileUpload;
