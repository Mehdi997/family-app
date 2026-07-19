-- ╔══════════════════════════════════════════════════════════╗
-- ║  FamilyApp - Schéma complet de la base de données      ║
-- ║  Application de gestion familiale algérienne            ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE DATABASE IF NOT EXISTS family_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE family_app;

-- ─── Familles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS families (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  currency VARCHAR(10) DEFAULT 'DA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Utilisateurs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255),
  role ENUM('chef', 'conjoint', 'enfant', 'autre') DEFAULT 'autre',
  is_active BOOLEAN DEFAULT TRUE,
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Invitations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  invited_by INT NOT NULL,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('conjoint', 'enfant', 'autre') DEFAULT 'autre',
  status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Catégories ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT,
  name VARCHAR(100) NOT NULL,
  type ENUM('expense', 'income', 'bill', 'grocery', 'saving', 'vehicle') NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Factures (Bills) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  created_by INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  category_id INT,
  organism VARCHAR(100),
  holder VARCHAR(100),
  client_number VARCHAR(50),
  amount DECIMAL(12,2) NOT NULL,
  frequency ENUM('weekly','biweekly','monthly','bimonthly','quarterly','semiannual','annual','custom') DEFAULT 'monthly',
  custom_days INT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notify_30 BOOLEAN DEFAULT TRUE,
  notify_15 BOOLEAN DEFAULT TRUE,
  notify_7 BOOLEAN DEFAULT TRUE,
  notify_3 BOOLEAN DEFAULT TRUE,
  notify_1 BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Paiements de factures ──────────────────────────────────
CREATE TABLE IF NOT EXISTS bill_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  family_id INT NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending','paid','overdue') DEFAULT 'pending',
  invoice_file VARCHAR(255),
  receipt_file VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Revenus / Salaires ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS incomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('salary','bonus','freelance','rental','other') DEFAULT 'salary',
  label VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency ENUM('monthly','annual','one_time') DEFAULT 'monthly',
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Dépenses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  user_id INT NOT NULL,
  category_id INT,
  label VARCHAR(150) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  receipt_file VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Économies (Enveloppes) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS savings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  target_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Transactions d'économies ───────────────────────────────
CREATE TABLE IF NOT EXISTS saving_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  saving_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type ENUM('deposit','withdrawal') DEFAULT 'deposit',
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (saving_id) REFERENCES savings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Listes de courses ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('weekly','monthly','custom') DEFAULT 'weekly',
  budget DECIMAL(12,2),
  store VARCHAR(100),
  date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Articles de courses ────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(20),
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  category VARCHAR(50),
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES grocery_lists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Planning des repas ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  date DATE NOT NULL,
  meal_type ENUM('breakfast','lunch','dinner','snack') NOT NULL,
  name VARCHAR(150) NOT NULL,
  ingredients TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Véhicules ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT,
  plate VARCHAR(30),
  photo VARCHAR(255),
  current_mileage INT DEFAULT 0,
  oil_change_interval INT DEFAULT 10000,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Vidanges ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oil_changes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  mileage INT NOT NULL,
  date DATE NOT NULL,
  cost DECIMAL(10,2),
  garage VARCHAR(100),
  invoice_file VARCHAR(255),
  receipt_file VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Assurances véhicules ───────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicle_insurance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  annual_amount DECIMAL(12,2) NOT NULL,
  company VARCHAR(100),
  policy_number VARCHAR(50),
  document_file VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Loyer ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rent (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  label VARCHAR(100) DEFAULT 'Loyer',
  amount DECIMAL(12,2) NOT NULL,
  frequency ENUM('monthly','quarterly','semiannual','annual') DEFAULT 'annual',
  due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Paiements de loyer ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS rent_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rent_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  receipt_file VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rent_id) REFERENCES rent(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Documents ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  type ENUM('invoice','receipt','warranty','contract','insurance','other') DEFAULT 'other',
  file_path VARCHAR(255) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  tags VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  user_id INT,
  type ENUM('bill_due','bill_overdue','insurance_expiring','oil_change','budget_exceeded','saving_goal','general') NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT,
  reference_type VARCHAR(50),
  reference_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Paramètres ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL UNIQUE,
  currency VARCHAR(10) DEFAULT 'DA',
  language VARCHAR(10) DEFAULT 'fr',
  theme ENUM('light','dark','auto') DEFAULT 'auto',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  weekly_budget DECIMAL(12,2),
  monthly_budget DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════════════════
-- Catégories par défaut
-- ═══════════════════════════════════════════════════════════

INSERT INTO categories (name, type, icon, color, is_default) VALUES
-- Catégories de factures
('Électricité & Gaz', 'bill', 'ElectricBolt', '#FF9800', TRUE),
('Eau', 'bill', 'Water', '#2196F3', TRUE),
('Internet', 'bill', 'Wifi', '#9C27B0', TRUE),
('Téléphone fixe', 'bill', 'Phone', '#607D8B', TRUE),
('Téléphone mobile', 'bill', 'PhoneAndroid', '#4CAF50', TRUE),
('Loyer', 'bill', 'Home', '#795548', TRUE),

-- Catégories de dépenses
('Santé', 'expense', 'LocalHospital', '#F44336', TRUE),
('Éducation', 'expense', 'School', '#3F51B5', TRUE),
('Loisirs', 'expense', 'SportsEsports', '#E91E63', TRUE),
('Vêtements', 'expense', 'Checkroom', '#FF5722', TRUE),
('Restaurants', 'expense', 'Restaurant', '#FFC107', TRUE),
('Transport', 'expense', 'DirectionsCar', '#00BCD4', TRUE),
('Divers', 'expense', 'Category', '#9E9E9E', TRUE),

-- Catégories de revenus
('Salaire', 'income', 'AccountBalance', '#4CAF50', TRUE),
('Prime', 'income', 'CardGiftcard', '#8BC34A', TRUE),
('Freelance', 'income', 'Work', '#00BCD4', TRUE),
('Location', 'income', 'House', '#795548', TRUE),
('Autre revenu', 'income', 'AttachMoney', '#607D8B', TRUE),

-- Catégories de courses
('Fruits & Légumes', 'grocery', 'Eco', '#4CAF50', TRUE),
('Viandes & Poissons', 'grocery', 'SetMeal', '#F44336', TRUE),
('Produits laitiers', 'grocery', 'Egg', '#FFC107', TRUE),
('Boulangerie', 'grocery', 'BakeryDining', '#795548', TRUE),
('Boissons', 'grocery', 'LocalDrink', '#2196F3', TRUE),
('Produits ménagers', 'grocery', 'CleaningServices', '#9C27B0', TRUE),
('Hygiène', 'grocery', 'Soap', '#E91E63', TRUE),
('Épicerie', 'grocery', 'ShoppingBasket', '#FF9800', TRUE),

-- Catégories d'économies
('Vacances', 'saving', 'BeachAccess', '#FF9800', TRUE),
('Santé', 'saving', 'Healing', '#F44336', TRUE),
('Maison', 'saving', 'Home', '#795548', TRUE),
('Voiture', 'saving', 'DirectionsCar', '#2196F3', TRUE),
('Urgence', 'saving', 'Warning', '#FF5722', TRUE),
('Divers', 'saving', 'Savings', '#9E9E9E', TRUE);
