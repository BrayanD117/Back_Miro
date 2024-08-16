const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const reportId = req.body.id;
  
      if (!reportId) {
        return cb(new Error('Falta el ID del reporte'), false);
      }
  
      // Ruta absoluta hacia la carpeta MIRO
      const miroDirectory = path.join(os.homedir(), process.env.MIRO_BASE_PATH, reportId);
  
      // Verifica si la carpeta existe, si no, la crea
      if (!fs.existsSync(miroDirectory)) {
        fs.mkdirSync(miroDirectory, { recursive: true });
      }
  
      cb(null, miroDirectory); // Asigna la carpeta dinámica en ~/MIRO/{reportId}
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  
  const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
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
