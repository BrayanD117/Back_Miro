const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const miroDirectory = path.join(os.homedir(), process.env.MIRO_BASE_PATH, 'uploads')
      if (!fs.existsSync(miroDirectory)) {
        fs.mkdirSync(miroDirectory, { recursive: true })
      }
      cb(null, miroDirectory);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Genera un nombre único
    }
  });

  
  const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  };
  
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 2 }
  });

module.exports = upload;
