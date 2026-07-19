/**
 * Configuration Multer pour l'upload de fichiers
 * Gère les avatars, factures, reçus, documents, etc.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Configuration du stockage (compatible Vercel Serverless /tmp et local)
 */
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

/**
 * Filtre pour les images
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format d\'image non supporté. Utilisez JPEG, PNG, GIF ou WebP.'), false);
  }
};

/**
 * Filtre pour les documents
 */
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

// ─── Uploaders configurés ───
const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const uploadDocument = multer({
  storage: createStorage('documents'),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
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
