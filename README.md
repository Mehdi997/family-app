# 🏠 FamilyApp - Application de Gestion Familiale Algérienne

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%20(Supabase)-336791)

Application web moderne et complète pour gérer les finances, les factures, les courses, les véhicules et les tâches domestiques d'un foyer algérien.

---

## ✨ Fonctionnalités

### 🔐 Authentification
- Inscription / Connexion / Mot de passe oublié
- JWT sécurisé avec rate limiting
- Gestion multi-membres (famille)
- Système d'invitations par le chef de famille
- Rôles : Chef de famille, Conjoint, Enfant, Autre

### 📊 Tableau de bord
- KPIs financiers (dépenses, revenus, économies, reste disponible)
- Graphiques Recharts (revenus vs dépenses, catégories, évolution)
- Prochaines échéances (factures, assurances, vidanges)
- Alertes et notifications

### 🧾 Factures
- CRUD complet avec fréquences flexibles (hebdo → annuelle → personnalisée)
- **Factures algériennes préconfigurées** : Sonelgaz, SEAAL, Algérie Télécom, Djezzy, Mobilis, Ooredoo
- Notifications avant échéance (30, 15, 7, 3, 1 jours)
- Suspension / réactivation
- Historique complet des paiements
- Upload factures et reçus (PDF, images)

### 💰 Dépenses & Revenus
- Catégories personnalisables avec couleurs et icônes
- Filtres, recherche, tri, pagination
- Revenus par membre de famille
- Calcul automatique du revenu familial

### 💵 Économies (Enveloppes)
- Enveloppes d'épargne (Vacances, Santé, Maison, Voiture, Urgence...)
- Objectifs avec barre de progression
- Calcul automatique de l'épargne mensuelle nécessaire
- Dépôts et retraits avec historique

### 🛒 Courses
- Listes hebdomadaires / mensuelles
- Articles cochables avec prix estimé / réel
- Budget et calcul automatique du total
- Magasins / supermarchés

### 🍽️ Planning des repas
- Vue hebdomadaire (Petit-déjeuner, Déjeuner, Dîner, Collation)
- Génération automatique de liste de courses depuis les ingrédients

### 🚗 Véhicules
- **Vidanges** : suivi kilométrique, intervalle modifiable (10k/15k/20k km), notifications, historique
- **Assurances** : calcul automatique épargne mensuelle avant échéance
- Photos et documents associés

### 📅 Calendrier
- Vue mensuelle avec tous les événements
- Factures, assurances, courses, repas, loyer

### 🔔 Notifications automatiques
- Génération par cron (chaque jour à 8h)
- Factures à venir / en retard
- Assurances bientôt expirées
- Vidanges à effectuer

### 📄 Documents
- Bibliothèque avec upload (PDF, images, Word)
- Filtres par type (factures, reçus, garanties, contrats, assurances)
- Recherche par tags

### ⚙️ Paramètres
- Catégories personnalisables
- Budget hebdomadaire / mensuel
- Gestion des membres (invitations)
- Thème clair / sombre
- Devise : DA (Dinar Algérien)

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite |
| UI | Material UI (MUI) v5 |
| Routing | React Router v6 |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| Base de données | **PostgreSQL (Supabase)** |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Upload | Multer |
| Sécurité | Helmet, CORS, express-rate-limit |
| Architecture | MVC |

---

## 📁 Structure du projet

```
family-app/
│
├── client/                          # 🌐 Frontend React + Vite
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js            # Instance Axios + intercepteurs JWT
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── StatCard.jsx    # Carte KPI réutilisable
│   │   │   │   ├── PageHeader.jsx  # En-tête de page
│   │   │   │   ├── EmptyState.jsx  # État vide
│   │   │   │   └── LoadingScreen.jsx
│   │   │   └── layout/
│   │   │       ├── MainLayout.jsx  # Layout principal
│   │   │       ├── Sidebar.jsx     # Sidebar rétractable
│   │   │       └── Topbar.jsx      # Barre supérieure
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx     # État d'authentification
│   │   │   └── ThemeContext.jsx    # Mode clair / sombre
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── BillsPage.jsx
│   │   │   ├── ExpensesPage.jsx
│   │   │   ├── IncomesPage.jsx
│   │   │   ├── SavingsPage.jsx
│   │   │   ├── GroceriesPage.jsx
│   │   │   ├── MealsPage.jsx
│   │   │   ├── VehiclesPage.jsx
│   │   │   ├── CalendarPage.jsx
│   │   │   ├── DocumentsPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── theme/
│   │   │   └── theme.js           # Thème MUI (clair + sombre)
│   │   ├── utils/
│   │   │   └── format.js          # Formatage (DA, dates, statuts)
│   │   ├── App.jsx                # Routes + Providers
│   │   └── main.jsx               # Point d'entrée
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # ⚙️ Backend Express.js
│   ├── config/
│   │   ├── database.js            # Connexion PostgreSQL (Supabase)
│   │   ├── schema-supabase.sql    # 📌 Schéma pour Supabase
│   │   ├── schema.sql             # Schéma MySQL (ancien, référence)
│   │   └── schema-production.sql  # Schéma MySQL prod (ancien)
│   ├── controllers/               # Logique métier (MVC)
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── billsController.js
│   │   ├── expensesController.js
│   │   ├── incomesController.js
│   │   ├── savingsController.js
│   │   ├── groceriesController.js
│   │   ├── mealsController.js
│   │   ├── vehiclesController.js
│   │   ├── documentsController.js
│   │   ├── notificationsController.js
│   │   ├── calendarController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   ├── auth.js                # Vérification JWT
│   │   ├── upload.js              # Configuration Multer
│   │   └── validate.js            # Validation express-validator
│   ├── routes/                    # Routes API REST
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── bills.js
│   │   ├── expenses.js
│   │   ├── incomes.js
│   │   ├── savings.js
│   │   ├── groceries.js
│   │   ├── meals.js
│   │   ├── vehicles.js
│   │   ├── documents.js
│   │   ├── notifications.js
│   │   ├── calendar.js
│   │   └── settings.js
│   ├── uploads/                   # Fichiers uploadés
│   │   ├── avatars/
│   │   ├── documents/
│   │   ├── receipts/
│   │   ├── invoices/
│   │   ├── vehicles/
│   │   └── insurance/
│   ├── server.js                  # Point d'entrée Express
│   ├── .env                       # Variables d'environnement (local)
│   ├── .env.example               # Template des variables
│   └── package.json
│
├── GUIDE_DEPLOIEMENT.md            # Guide déploiement Supabase + Render + Vercel
└── README.md                       # Ce fichier
```

---

## 🚀 Installation & Test en local

### Prérequis

| Logiciel | Version | Lien |
|----------|---------|------|
| Node.js | ≥ 18 | https://nodejs.org |
| Git | Dernière | https://git-scm.com |
| VS Code | Dernière | https://code.visualstudio.com |
| Navigateur | Chrome/Edge/Firefox | - |

> ⚠️ **Pas besoin d'installer PostgreSQL/MySQL sur votre PC !**
> On utilise Supabase (cloud gratuit) même en local.

---

### Étape 1 : Créer la base de données Supabase (5 min)

1. Allez sur **https://supabase.com** → **"Start your project"**
2. Connectez-vous avec **GitHub**
3. Cliquez **"New Project"** :
   - **Name** : `familyapp`
   - **Database Password** : créez un mot de passe fort → **NOTEZ-LE** ⚠️
   - **Region** : `West EU (Ireland)`
4. Attendez ~2 min que le projet soit prêt

5. Récupérez l'**URI de connexion** :
   - **Settings** (engrenage) → **Database** → **Connection string** → onglet **URI**
   - Copiez l'URI et remplacez `[YOUR-PASSWORD]` par votre mot de passe
   - Exemple : `postgresql://postgres.abc123:MonMotDePasse@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`

6. Créez les tables :
   - Cliquez **"SQL Editor"** (menu gauche)
   - Cliquez **"New query"**
   - Copiez-collez le contenu du fichier `server/config/schema-supabase.sql`
   - Cliquez **"Run"**
   - ✅ Vous voyez "Success" → 21 tables créées + 32 catégories par défaut

---

### Étape 2 : Configurer le Backend (2 min)

```powershell
cd C:\Users\VOTRE_NOM\Downloads\family-app\server
```

Ouvrez le fichier `.env` avec VS Code et modifiez :

```env
PORT=5000
NODE_ENV=development

# Collez votre URI Supabase ici ↓
DATABASE_URL=postgresql://postgres.abc123:MonMotDePasse@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

JWT_SECRET=mon_secret_local_pour_test_123
JWT_REFRESH_SECRET=mon_autre_secret_local_456
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
CLIENT_URL=http://localhost:5173
```

Installez les dépendances :

```powershell
npm install
```

---

### Étape 3 : Configurer le Frontend (1 min)

```powershell
cd C:\Users\VOTRE_NOM\Downloads\family-app\client
npm install
```

Pas besoin de fichier `.env` en local, l'API pointe déjà vers `http://localhost:5000/api` par défaut.

---

### Étape 4 : Lancer l'application (30 sec)

Ouvrez **2 terminaux PowerShell** :

**Terminal 1 - Backend :**
```powershell
cd C:\Users\VOTRE_NOM\Downloads\family-app\server
npm run dev
```

Vous devez voir :
```
✅ Connexion PostgreSQL (Supabase) établie avec succès
🚀 Serveur démarré sur le port 5000
📡 API : http://localhost:5000/api
🏥 Santé : http://localhost:5000/api/health
```

**Terminal 2 - Frontend :**
```powershell
cd C:\Users\VOTRE_NOM\Downloads\family-app\client
npm run dev
```

Vous devez voir :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### Étape 5 : Tester ! 🎉

1. Ouvrez **http://localhost:5173** dans votre navigateur
2. Cliquez **"Créer un compte"**
3. Remplissez le formulaire :
   - Prénom : `Mohamed`
   - Nom : `Benali`
   - Nom de famille : `Famille Benali`
   - Email : `test@test.com`
   - Mot de passe : `123456`
4. Cliquez **"Créer mon compte"**

✅ **Vous arrivez sur le Dashboard !**

---

### Étape 6 : Parcourir l'application

Testez chaque rubrique :

| Rubrique | Que tester |
|----------|-----------|
| **Factures** | Vous verrez les 7 factures algériennes préconfigurées (Sonelgaz, SEAAL...). Activez-en une, modifiez le montant. |
| **Dépenses** | Ajoutez une dépense (ex: "Courses Carrefour", 3500 DA, catégorie Divers) |
| **Revenus** | Ajoutez votre salaire mensuel |
| **Économies** | Les 6 enveloppes sont déjà créées. Définissez un objectif et faites un dépôt. |
| **Courses** | Créez une liste "Courses semaine", ajoutez des articles, cochez-les |
| **Repas** | Planifiez un repas "Couscous" pour vendredi midi |
| **Véhicules** | Ajoutez votre voiture, enregistrez une vidange |
| **Calendrier** | Vérifiez que vos événements apparaissent |
| **Documents** | Uploadez un PDF ou une image |
| **Paramètres** | Testez le mode sombre, ajoutez une catégorie personnalisée |
| **Profil** | Changez votre photo de profil |

---

### Vérifier les données dans Supabase

Pendant vos tests, allez sur Supabase → **Table Editor** :
- **users** → votre compte
- **families** → votre famille + code unique
- **bills** → les factures algériennes
- **savings** → les 6 enveloppes
- **categories** → 32 catégories par défaut + vos catégories personnalisées
- **expenses** → les dépenses que vous avez ajoutées

---

### Tester l'API directement (optionnel)

Ouvrez un navigateur ou utilisez Postman/Thunder Client :

```
GET  http://localhost:5000/api/health          → État du serveur
POST http://localhost:5000/api/auth/login       → Connexion
GET  http://localhost:5000/api/dashboard        → Dashboard (avec token)
GET  http://localhost:5000/api/bills            → Liste des factures
GET  http://localhost:5000/api/expenses         → Liste des dépenses
GET  http://localhost:5000/api/savings          → Enveloppes d'économies
```

Pour les routes protégées, ajoutez le header :
```
Authorization: Bearer VOTRE_TOKEN_JWT
```

---

## 📡 API REST complète

### Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/register` | Inscription + création famille |
| `POST` | `/api/auth/login` | Connexion → retourne JWT |
| `GET` | `/api/auth/me` | Profil de l'utilisateur connecté |
| `PUT` | `/api/auth/profile` | Mise à jour profil (+ avatar) |
| `PUT` | `/api/auth/password` | Changer le mot de passe |
| `POST` | `/api/auth/forgot-password` | Demande de réinitialisation |
| `POST` | `/api/auth/reset-password` | Réinitialiser avec token |
| `POST` | `/api/auth/invite` | Inviter un membre (chef uniquement) |
| `POST` | `/api/auth/join` | Rejoindre une famille |

### Dashboard
| `GET` | `/api/dashboard` | Toutes les données du tableau de bord |

### Factures
| `GET` | `/api/bills` | Liste (filtres: status, category, search) |
| `GET` | `/api/bills/:id` | Détail + historique paiements |
| `POST` | `/api/bills` | Créer une facture |
| `PUT` | `/api/bills/:id` | Modifier |
| `DELETE` | `/api/bills/:id` | Supprimer |
| `PUT` | `/api/bills/:id/toggle` | Suspendre / réactiver |
| `POST` | `/api/bills/:id/pay` | Enregistrer un paiement |

### Dépenses
| `GET` | `/api/expenses` | Liste (filtres, tri, pagination) |
| `POST` | `/api/expenses` | Créer (+ upload reçu) |
| `PUT` | `/api/expenses/:id` | Modifier |
| `DELETE` | `/api/expenses/:id` | Supprimer |

### Revenus
| `GET` | `/api/incomes` | Liste + totaux mensuels/annuels/par membre |
| `POST` | `/api/incomes` | Créer |
| `PUT` | `/api/incomes/:id` | Modifier |
| `DELETE` | `/api/incomes/:id` | Supprimer |

### Économies
| `GET` | `/api/savings` | Enveloppes avec calculs |
| `POST` | `/api/savings` | Créer une enveloppe |
| `PUT` | `/api/savings/:id` | Modifier |
| `DELETE` | `/api/savings/:id` | Supprimer |
| `POST` | `/api/savings/:id/transaction` | Dépôt ou retrait |
| `GET` | `/api/savings/:id/transactions` | Historique |

### Courses
| `GET` | `/api/groceries` | Listes de courses |
| `GET` | `/api/groceries/:id` | Détail + articles |
| `POST` | `/api/groceries` | Créer une liste |
| `POST` | `/api/groceries/:id/items` | Ajouter un article |
| `PUT` | `/api/groceries/items/:id` | Modifier un article |
| `PUT` | `/api/groceries/items/:id/toggle` | Cocher / décocher |
| `DELETE` | `/api/groceries/:id` | Supprimer une liste |
| `DELETE` | `/api/groceries/items/:id` | Supprimer un article |

### Repas
| `GET` | `/api/meals` | Planning (par période) |
| `POST` | `/api/meals` | Ajouter un repas |
| `PUT` | `/api/meals/:id` | Modifier |
| `DELETE` | `/api/meals/:id` | Supprimer |
| `POST` | `/api/meals/generate-grocery` | Générer liste de courses |

### Véhicules
| `GET` | `/api/vehicles` | Liste avec vidanges + assurances |
| `POST` | `/api/vehicles` | Ajouter (+ photo) |
| `PUT` | `/api/vehicles/:id` | Modifier |
| `DELETE` | `/api/vehicles/:id` | Supprimer |
| `POST` | `/api/vehicles/:id/oil-change` | Enregistrer une vidange |
| `GET` | `/api/vehicles/:id/oil-changes` | Historique vidanges |
| `POST` | `/api/vehicles/:id/insurance` | Ajouter une assurance |
| `GET` | `/api/vehicles/:id/insurance` | Historique assurances |

### Calendrier
| `GET` | `/api/calendar` | Événements du mois (tous types) |

### Documents
| `GET` | `/api/documents` | Liste (filtres type, search, tags) |
| `POST` | `/api/documents` | Uploader un fichier |
| `DELETE` | `/api/documents/:id` | Supprimer |

### Notifications
| `GET` | `/api/notifications` | Liste (unreadOnly) |
| `PUT` | `/api/notifications/:id/read` | Marquer comme lu |
| `PUT` | `/api/notifications/read-all` | Tout marquer comme lu |
| `DELETE` | `/api/notifications/:id` | Supprimer |

### Paramètres
| `GET` | `/api/settings` | Paramètres + catégories + membres |
| `PUT` | `/api/settings` | Modifier les paramètres |
| `POST` | `/api/settings/categories` | Créer une catégorie |
| `PUT` | `/api/settings/categories/:id` | Modifier |
| `DELETE` | `/api/settings/categories/:id` | Supprimer (non par défaut) |

---

## 🎨 Design

- **Palette** : Indigo (#6366F1), Pink (#EC4899), Green (#10B981)
- **Mode** : Clair & Sombre (basculement instantané)
- **Typographie** : Inter (Google Fonts)
- **Inspiration** : Material Design 3, Notion, Linear, Stripe
- **Animations** : Transitions douces sur les cartes et boutons (hover, focus)
- **Responsive** : Mobile-first, breakpoints MUI (xs, sm, md, lg)
- **Sidebar** : Rétractable sur desktop, drawer sur mobile

---

## 🔒 Sécurité

| Protection | Détail |
|------------|--------|
| HTTPS | Automatique sur Vercel + Render |
| JWT | Tokens signés HS256, expiration 7 jours |
| Mots de passe | bcrypt 12 rounds (irréversible) |
| CORS | Bloque toute origine non autorisée |
| Rate Limiting | 100 requêtes/15 min, 5 login/15 min |
| Helmet.js | 11 headers de sécurité HTTP |
| Validation | express-validator sur toutes les entrées |
| Upload | Types MIME vérifiés + taille limitée (10 Mo) |
| SQL Injection | Requêtes paramétrées ($1, $2...) |
| XSS | React échappe automatiquement le HTML |

---

## 🚢 Déploiement gratuit

Consultez le fichier **[GUIDE_DEPLOIEMENT.md](./GUIDE_DEPLOIEMENT.md)** pour le guide complet.

**Résumé en 6 étapes (~20 min) :**

| # | Étape | Service | Coût |
|---|-------|---------|------|
| 1 | Base de données PostgreSQL | **Supabase** | Gratuit |
| 2 | Code source | **GitHub** | Gratuit |
| 3 | Backend Node.js | **Render** | Gratuit |
| 4 | Frontend React | **Vercel** | Gratuit |
| 5 | Connecter Frontend ↔ Backend | CORS | - |
| 6 | Tester | Créer un compte | - |

---

## 🐛 Dépannage

### "Connexion PostgreSQL échouée"
→ Vérifiez votre `DATABASE_URL` dans `.env`
→ Vérifiez que vous avez remplacé `[YOUR-PASSWORD]` par le vrai mot de passe
→ Sur Supabase, vérifiez que le projet n'est pas en pause

### "CORS error" dans la console
→ Vérifiez que `CLIENT_URL` dans `.env` correspond exactement à l'URL du frontend
→ En local : `http://localhost:5173` (pas de `/` à la fin)

### "Token expiré"
→ Normal après 7 jours. Reconnectez-vous.

### "Erreur 500"
→ Regardez les logs du terminal backend
→ Vérifiez que les tables existent dans Supabase

### "npm ENOSPC: no space left on device"
→ Votre disque est plein. Libérez de l'espace :
```powershell
npm cache clean --force
```
→ Supprimez les `node_modules` des autres projets

### Le serveur Render met du temps à répondre
→ Normal avec le plan gratuit (dort après 15 min d'inactivité)
→ La première requête prend ~30 sec, ensuite c'est instantané

---

## 📋 Roadmap

- [ ] Notifications push (Web Push API)
- [ ] Rappels par email (Nodemailer / Resend)
- [ ] Export PDF des rapports mensuels
- [ ] Application mobile (React Native)
- [ ] PWA (Progressive Web App)
- [ ] Synchronisation cloud multi-appareil
- [ ] Mode SaaS multi-familles
- [ ] Intégration bancaire
- [ ] Traduction arabe (عربية)

---

## 📄 Licence

MIT License - Libre d'utilisation et de modification.

---

**Développé avec ❤️ pour les familles algériennes 🇩🇿**
