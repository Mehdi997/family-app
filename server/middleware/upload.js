const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID: uuidv4 } = require('crypto');

const createStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const baseDir = process.env.VERCEL
        ? path.join('/tmp', 'uploads', subfolder)
        : path.join(__dirname, '..', 'uploads', subfolder);
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch (err) {
        console.error('Erreur création dossier:', err);
      }
      cb(null, baseDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      cb(null, filename);
    },
  });
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format d\'image non supporté. Utilisez JPEG, PNG, GIF ou WebP.'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté. Utilisez des images, PDF ou documents Word.'), false);
  }
};

const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadDocument = multer({
  storage: createStorage('documents'),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadInvoice = multer({
  storage: createStorage('invoices'),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadReceipt = multer({
  storage: createStorage('receipts'),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadVehicle = multer({
  storage: createStorage('vehicles'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadInsurance = multer({
  storage: createStorage('insurance'),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  uploadAvatar,
  uploadDocument,
  uploadInvoice,
  uploadReceipt,
  uploadVehicle,
  uploadInsurance,
};