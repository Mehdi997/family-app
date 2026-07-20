# Script PowerShell pour configurer origin et écrire les fichiers Vercel localement
Set-Location "C:\Users\WINDOWS\Downloads\maison\family-app"

# 1. Connecter Git au dépôt GitHub origin
try {
    git remote add origin https://github.com/Mehdi997/family-app.git 2>$null
} catch {}
try {
    git remote set-url origin https://github.com/Mehdi997/family-app.git 2>$null
} catch {}

# 2. Créer le dossier api
New-Item -ItemType Directory -Force -Path "api" | Out-Null

# 3. Créer vercel.json
@"
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/uploads/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 8 * * *"
    }
  ]
}
"@ | Set-Content -Path "vercel.json" -Encoding UTF8

# 4. Créer package.json à la racine
@"
{
  "name": "family-app-monorepo",
  "version": "1.0.0",
  "description": "FamilyApp - Application de gestion familiale algérienne full-stack sur Vercel",
  "scripts": {
    "build": "cd server && npm install && cd ../client && npm install && npm run build",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "express-rate-limit": "^8.6.0",
    "express-validator": "^7.3.2",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.11.0",
    "multer": "^2.2.0",
    "node-cron": "^4.6.0",
    "pg": "^8.22.0",
    "uuid": "^14.0.1"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "nodemon": "^3.1.14"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
"@ | Set-Content -Path "package.json" -Encoding UTF8

# 5. Créer api/index.js
@"
const app = require('../server/server');

module.exports = (req, res) => {
  return app(req, res);
};
"@ | Set-Content -Path "api\index.js" -Encoding UTF8

# 6. Créer api/cron.js
@"
const { generateNotifications } = require('../server/controllers/notificationsController');

module.exports = async (req, res) => {
  try {
    await generateNotifications();
    res.status(200).json({ success: true, message: 'Notifications générées.' });
  } catch (error) {
    console.error('Erreur cron Vercel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
"@ | Set-Content -Path "api\cron.js" -Encoding UTF8

# 7. Mettre à jour client/src/api/axios.js
@"
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isExpired = error.response?.data?.expired;
      if (isExpired) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
"@ | Set-Content -Path "client\src\api\axios.js" -Encoding UTF8

# 8. Mettre à jour server/middleware/upload.js
@"
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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
"@ | Set-Content -Path "server\middleware\upload.js" -Encoding UTF8

# 9. Mettre à jour server/server.js
@"
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { generateNotifications } = require('./controllers/notificationsController');

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes.' },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/incomes', require('./routes/incomes'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/groceries', require('./routes/groceries'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Fichier trop volumineux.' });
  }

  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

if (!process.env.VERCEL) {
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ Génération des notifications...');
    generateNotifications();
  });
}

const PORT = process.env.PORT || 5000;

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📡 API : http://localhost:${PORT}/api`);
    console.log(`🏥 Santé : http://localhost:${PORT}/api/health\n`);
  });
};

if (!process.env.VERCEL) {
  start();
}

module.exports = app;
"@ | Set-Content -Path "server\server.js" -Encoding UTF8

# 10. Pousser vers GitHub
git add .
git commit -m "Passage en architecture 100% Vercel Serverless (Sans carte bancaire)"
git branch -M main
git push -u origin main
