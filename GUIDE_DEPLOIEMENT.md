# 🚀 Guide de Déploiement Gratuit - FamilyApp + Supabase

## Architecture simplifiée (3 services, 0 DA)

```
👤 Utilisateur
    │
    ▼
🌐 Vercel ─── Frontend React
    │          familyapp.vercel.app
    ▼
⚙️  Render ─── Backend Express
    │          familyapp-api.onrender.com
    ▼
🐘 Supabase ── PostgreSQL gratuit
               Interface visuelle incluse
```

---

# ÉTAPE 1 : Créer la base de données (Supabase) ⏱️ 5 min

## 1.1 Créer un compte

1. Allez sur **https://supabase.com**
2. Cliquez **"Start your project"**
3. Connectez-vous avec **GitHub** (le plus simple)

## 1.2 Créer un nouveau projet

1. Cliquez **"New Project"**
2. Remplissez :
   - **Name** : `familyapp`
   - **Database Password** : créez un mot de passe fort → **NOTEZ-LE** ⚠️
   - **Region** : `West EU (Ireland)` (le plus proche de l'Algérie)
3. Cliquez **"Create new project"**
4. Attendez ~2 minutes que le projet soit prêt ✅

## 1.3 Récupérer l'URL de connexion

1. Allez dans **Settings** (icône engrenage en bas à gauche)
2. Cliquez **"Database"**
3. Section **"Connection string"** → onglet **"URI"**
4. Copiez l'URI, elle ressemble à :
```
postgresql://postgres.[VOTRE-REF]:[VOTRE-MOT-DE-PASSE]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```
5. Remplacez `[YOUR-PASSWORD]` par le mot de passe du projet

📋 **GARDEZ CETTE URI** → vous en aurez besoin à l'étape 3.

## 1.4 Créer les tables

1. Dans Supabase, cliquez **"SQL Editor"** (menu de gauche)
2. Cliquez **"New query"**
3. Ouvrez le fichier `server/config/schema-supabase.sql` sur votre PC
4. **Copiez-collez TOUT le contenu** dans l'éditeur SQL
5. Cliquez **"Run"** (ou Ctrl+Enter)
6. ✅ Vous devez voir "Success. No rows returned" (c'est normal)

## 1.5 Vérifier

1. Cliquez **"Table Editor"** dans le menu
2. Vous devez voir **21 tables** créées
3. Cliquez sur **"categories"** → vous verrez les 32 catégories pré-remplies

🎉 **Base de données prête !**

---

# ÉTAPE 2 : Pousser le code sur GitHub ⏱️ 3 min

## 2.1 Créer le repo

1. Allez sur **https://github.com/new**
2. **Repository name** : `family-app`
3. **Private** (recommandé)
4. Cliquez **"Create repository"**

## 2.2 Pousser le code

Ouvrez PowerShell dans le dossier du projet :

```powershell
cd C:\Users\WINDOWS\Downloads\maison\family-app

git init
git add .
git commit -m "FamilyApp v1.0 - Supabase"
git remote add origin https://github.com/VOTRE_USERNAME/family-app.git
git branch -M main
git push -u origin main
```

Si Git demande vos identifiants, entrez votre username et un **Personal Access Token** (pas votre mot de passe).

---

# ÉTAPE 3 : Déployer le Backend sur Render ⏱️ 5 min

## 3.1 Générer vos secrets JWT

Dans PowerShell, exécutez **2 fois** :

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Ça génère un texte long comme :
```
a3f7b2c9d8e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8...
```

📋 **Copiez les 2 résultats** (un pour JWT_SECRET, un pour JWT_REFRESH_SECRET).

## 3.2 Créer le service

1. Allez sur **https://render.com** → connectez-vous avec GitHub
2. Cliquez **"New +"** → **"Web Service"**
3. Sélectionnez votre repo **family-app**
4. Configurez :

| Champ | Valeur |
|-------|--------|
| **Name** | `familyapp-api` |
| **Region** | `Frankfurt (EU)` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

5. Cliquez **"Environment"** → ajoutez ces variables **une par une** :

| Variable | Valeur |
|----------|--------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres...` ← l'URI de Supabase (étape 1.3) |
| `JWT_SECRET` | Le 1er texte généré à l'étape 3.1 |
| `JWT_REFRESH_SECRET` | Le 2ème texte généré |
| `JWT_EXPIRE` | `7d` |
| `JWT_REFRESH_EXPIRE` | `30d` |
| `CLIENT_URL` | `https://familyapp.vercel.app` ← on corrigera après |
| `UPLOAD_PATH` | `./uploads` |
| `MAX_FILE_SIZE` | `10485760` |

6. Cliquez **"Create Web Service"**
7. ⏳ Attendez 3-5 minutes

## 3.3 Tester

Quand le déploiement est terminé, Render donne une URL.
Ouvrez-la dans votre navigateur en ajoutant `/api/health` :

```
https://familyapp-api-xxxx.onrender.com/api/health
```

✅ Vous devez voir : `{"status":"OK","timestamp":"..."}`

📋 **Notez l'URL du backend** (ex: `https://familyapp-api-xxxx.onrender.com`)

---

# ÉTAPE 4 : Déployer le Frontend sur Vercel ⏱️ 3 min

1. Allez sur **https://vercel.com** → connectez-vous avec GitHub
2. Cliquez **"Add New..."** → **"Project"**
3. Sélectionnez votre repo **family-app**
4. Configurez :

| Champ | Valeur |
|-------|--------|
| **Framework Preset** | `Vite` |
| **Root Directory** | cliquez **Edit** → tapez `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Cliquez **"Environment Variables"** → ajoutez :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://familyapp-api-xxxx.onrender.com/api` ← URL Render + `/api` |

6. Cliquez **"Deploy"**
7. ⏳ Attendez 1-2 minutes
8. ✅ Vercel donne votre URL (ex: `https://family-app-xxx.vercel.app`)

---

# ÉTAPE 5 : Connecter Frontend ↔ Backend ⏱️ 1 min

## Mettre à jour le CORS

1. Retournez sur **Render** → votre service → **"Environment"**
2. Modifiez `CLIENT_URL` :
```
CLIENT_URL = https://family-app-xxx.vercel.app
```
(l'URL exacte donnée par Vercel, sans `/` à la fin)

3. Render redémarre automatiquement (~30 sec)

---

# ÉTAPE 6 : Tester ! 🎉 ⏱️ 2 min

1. Ouvrez votre URL Vercel
2. Cliquez **"Créer un compte"**
3. Remplissez :
   - Prénom, Nom
   - Nom de famille : `Famille Benali` (exemple)
   - Email, Mot de passe
4. Cliquez **"Créer mon compte"**
5. ✅ Vous arrivez sur le **Dashboard** !

## Vérifier dans Supabase

1. Retournez sur Supabase → **Table Editor**
2. Cliquez sur **"users"** → votre compte apparaît
3. Cliquez sur **"families"** → votre famille apparaît
4. Cliquez sur **"bills"** → les 7 factures algériennes préconfigurées
5. Cliquez sur **"savings"** → les 6 enveloppes d'épargne

---

# 🔒 Sécurité (déjà en place)

| Protection | Statut |
|------------|--------|
| HTTPS | ✅ Automatique (Vercel + Render) |
| JWT | ✅ Tokens signés, expiration 7j |
| Mots de passe | ✅ Hashés bcrypt 12 rounds |
| CORS | ✅ Origine Vercel uniquement |
| Rate Limiting | ✅ 100 req/15min, 5 login/15min |
| Helmet.js | ✅ Headers de sécurité HTTP |
| Validation | ✅ express-validator |
| Upload | ✅ Types + taille contrôlés |
| SQL Injection | ✅ Requêtes paramétrées |

---

# 💰 Coût total : 0 DA

| Service | Ce qu'il offre | Coût |
|---------|---------------|------|
| Supabase | PostgreSQL 500 Mo, interface visuelle | **Gratuit** |
| Render | Backend Node.js, 750h/mois | **Gratuit** |
| Vercel | Frontend React, CDN mondial | **Gratuit** |
| GitHub | Code source privé | **Gratuit** |

---

# ⚠️ Limites du plan gratuit

## Render
- Le serveur **dort après 15 min** d'inactivité
- Premier chargement : ~30 secondes
- **Astuce** : créez un compte sur https://uptimerobot.com et ajoutez un ping HTTP sur `https://votre-api.onrender.com/api/health` toutes les 5 minutes

## Supabase
- 500 Mo de stockage
- Pause après 1 semaine d'inactivité (plan gratuit)
- 2 projets max

## Vercel
- 100 Go de bande passante/mois
- Largement suffisant pour un usage familial

---

# 🔄 Mises à jour futures

Pour chaque modification :

```powershell
# Modifier votre code
git add .
git commit -m "Description de la modification"
git push
```

✅ Render et Vercel **redéploient automatiquement** !

---

# 📋 Checklist résumé

- [ ] Compte Supabase → projet créé → URI copiée
- [ ] Tables créées via SQL Editor
- [ ] Code poussé sur GitHub
- [ ] Backend déployé sur Render avec variables d'env
- [ ] `/api/health` répond OK
- [ ] Frontend déployé sur Vercel avec `VITE_API_URL`
- [ ] `CLIENT_URL` mis à jour sur Render
- [ ] Inscription testée ✅
- [ ] Connexion testée ✅
- [ ] Dashboard fonctionne ✅

**Temps total estimé : ~20 minutes** ⏱️
