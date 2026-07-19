-- ╔══════════════════════════════════════════════════════════╗
-- ║  FamilyApp - Schéma PostgreSQL pour Supabase            ║
-- ║  Copiez-collez dans l'éditeur SQL de Supabase           ║
-- ╚══════════════════════════════════════════════════════════╝

-- ─── Familles ───
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  currency VARCHAR(10) DEFAULT 'DA',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Utilisateurs ───
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  family_id INT REFERENCES families(id) ON DELETE SET NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255),
  role VARCHAR(20) DEFAULT 'autre' CHECK (role IN ('chef','conjoint','enfant','autre')),
  is_active BOOLEAN DEFAULT TRUE,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Invitations ───
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invited_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'autre' CHECK (role IN ('conjoint','enfant','autre')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Catégories ───
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  family_id INT REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense','income','bill','grocery','saving','vehicle')),
  icon VARCHAR(50),
  color VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Factures ───
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  organism VARCHAR(100),
  holder VARCHAR(100),
  client_number VARCHAR(50),
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(20) DEFAULT 'monthly' CHECK (frequency IN ('weekly','biweekly','monthly','bimonthly','quarterly','semiannual','annual','custom')),
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Paiements de factures ───
CREATE TABLE IF NOT EXISTS bill_payments (
  id SERIAL PRIMARY KEY,
  bill_id INT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  paid_date DATE,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue')),
  invoice_file VARCHAR(255),
  receipt_file VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Revenus ───
CREATE TABLE IF NOT EXISTS incomes (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'salary' CHECK (type IN ('salary','bonus','freelance','rental','other')),
  label VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(20) DEFAULT 'monthly' CHECK (frequency IN ('monthly','annual','one_time')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Dépenses ───
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  label VARCHAR(150) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  receipt_file VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Économies ───
CREATE TABLE IF NOT EXISTS savings (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  target_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Transactions d'économies ───
CREATE TABLE IF NOT EXISTS saving_transactions (
  id SERIAL PRIMARY KEY,
  saving_id INT NOT NULL REFERENCES savings(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type VARCHAR(20) DEFAULT 'deposit' CHECK (type IN ('deposit','withdrawal')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Listes de courses ───
CREATE TABLE IF NOT EXISTS grocery_lists (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'weekly' CHECK (type IN ('weekly','monthly','custom')),
  budget DECIMAL(12,2),
  store VARCHAR(100),
  date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Articles de courses ───
CREATE TABLE IF NOT EXISTS grocery_items (
  id SERIAL PRIMARY KEY,
  list_id INT NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(20),
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  category VARCHAR(50),
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Planning des repas ───
CREATE TABLE IF NOT EXISTS meal_plans (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  name VARCHAR(150) NOT NULL,
  ingredients TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Véhicules ───
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT,
  plate VARCHAR(30),
  photo VARCHAR(255),
  current_mileage INT DEFAULT 0,
  oil_change_interval INT DEFAULT 10000,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Vidanges ───
CREATE TABLE IF NOT EXISTS oil_changes (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mileage INT NOT NULL,
  date DATE NOT NULL,
  cost DECIMAL(10,2),
  garage VARCHAR(100),
  invoice_file VARCHAR(255),
  receipt_file VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Assurances véhicules ───
CREATE TABLE IF NOT EXISTS vehicle_insurance (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  annual_amount DECIMAL(12,2) NOT NULL,
  company VARCHAR(100),
  policy_number VARCHAR(50),
  document_file VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Loyer ───
CREATE TABLE IF NOT EXISTS rent (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  label VARCHAR(100) DEFAULT 'Loyer',
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(20) DEFAULT 'annual' CHECK (frequency IN ('monthly','quarterly','semiannual','annual')),
  due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Paiements de loyer ───
CREATE TABLE IF NOT EXISTS rent_payments (
  id SERIAL PRIMARY KEY,
  rent_id INT NOT NULL REFERENCES rent(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  receipt_file VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Documents ───
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  uploaded_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(20) DEFAULT 'other' CHECK (type IN ('invoice','receipt','warranty','contract','insurance','other')),
  file_path VARCHAR(255) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  tags VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Notifications ───
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('bill_due','bill_overdue','insurance_expiring','oil_change','budget_exceeded','saving_goal','general')),
  title VARCHAR(150) NOT NULL,
  message TEXT,
  reference_type VARCHAR(50),
  reference_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Paramètres ───
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL UNIQUE REFERENCES families(id) ON DELETE CASCADE,
  currency VARCHAR(10) DEFAULT 'DA',
  language VARCHAR(10) DEFAULT 'fr',
  theme VARCHAR(10) DEFAULT 'auto' CHECK (theme IN ('light','dark','auto')),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  weekly_budget DECIMAL(12,2),
  monthly_budget DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- Catégories par défaut
-- ═══════════════════════════════════════════════════════════
INSERT INTO categories (name, type, icon, color, is_default) VALUES
('Électricité & Gaz', 'bill', 'ElectricBolt', '#FF9800', TRUE),
('Eau', 'bill', 'Water', '#2196F3', TRUE),
('Internet', 'bill', 'Wifi', '#9C27B0', TRUE),
('Téléphone fixe', 'bill', 'Phone', '#607D8B', TRUE),
('Téléphone mobile', 'bill', 'PhoneAndroid', '#4CAF50', TRUE),
('Loyer', 'bill', 'Home', '#795548', TRUE),
('Santé', 'expense', 'LocalHospital', '#F44336', TRUE),
('Éducation', 'expense', 'School', '#3F51B5', TRUE),
('Loisirs', 'expense', 'SportsEsports', '#E91E63', TRUE),
('Vêtements', 'expense', 'Checkroom', '#FF5722', TRUE),
('Restaurants', 'expense', 'Restaurant', '#FFC107', TRUE),
('Transport', 'expense', 'DirectionsCar', '#00BCD4', TRUE),
('Divers', 'expense', 'Category', '#9E9E9E', TRUE),
('Salaire', 'income', 'AccountBalance', '#4CAF50', TRUE),
('Prime', 'income', 'CardGiftcard', '#8BC34A', TRUE),
('Freelance', 'income', 'Work', '#00BCD4', TRUE),
('Location', 'income', 'House', '#795548', TRUE),
('Autre revenu', 'income', 'AttachMoney', '#607D8B', TRUE),
('Fruits & Légumes', 'grocery', 'Eco', '#4CAF50', TRUE),
('Viandes & Poissons', 'grocery', 'SetMeal', '#F44336', TRUE),
('Produits laitiers', 'grocery', 'Egg', '#FFC107', TRUE),
('Boulangerie', 'grocery', 'BakeryDining', '#795548', TRUE),
('Boissons', 'grocery', 'LocalDrink', '#2196F3', TRUE),
('Produits ménagers', 'grocery', 'CleaningServices', '#9C27B0', TRUE),
('Hygiène', 'grocery', 'Soap', '#E91E63', TRUE),
('Épicerie', 'grocery', 'ShoppingBasket', '#FF9800', TRUE),
('Vacances', 'saving', 'BeachAccess', '#FF9800', TRUE),
('Santé', 'saving', 'Healing', '#F44336', TRUE),
('Maison', 'saving', 'Home', '#795548', TRUE),
('Voiture', 'saving', 'DirectionsCar', '#2196F3', TRUE),
('Urgence', 'saving', 'Warning', '#FF5722', TRUE),
('Divers', 'saving', 'Savings', '#9E9E9E', TRUE);
