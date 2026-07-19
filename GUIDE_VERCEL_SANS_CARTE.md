# 🚀 Guide de Déploiement 100% VERCEL (0 DA, Sans Carte Bancaire)

Ce guide remplace l'ancienne méthode avec Render. Désormais, **tout l'hébergement (Frontend + Backend + Tâches automatisées)** fonctionne sur **Vercel** gratuitement, **sans aucune carte bancaire demandée** à l'inscription ni au déploiement !

---

## 🌟 Avantages de cette nouvelle architecture Vercel Monorepo

* 💳 **0 carte bancaire requise** (Vercel est 100% gratuit sur le plan Hobby via GitHub).
* ⚡ **Pas de mise en veille (0 temps d'attente)** : Contrairement au plan gratuit de Render qui s'endort après 15 min, les *Serverless Functions* de Vercel se réveillent instantanément en moins de 100 ms à chaque requête !
* 🔗 **Une seule URL pour tout le projet** : Votre application React et votre API Node.js cohabitent sous le même nom de domaine (ex: `https://familyapp.vercel.app` pour le site et `https://familyapp.vercel.app/api` pour l'API).
* ⏰ **Tâche planifiée gratuite incluse** : Vercel déclenche automatiquement la génération des notifications quotidiennes à 8h00 via le service `Vercel Cron Jobs`.

---

## ÉTAPE 1 : Pousser les nouvelles modifications sur GitHub *(⏱️ 2 min)*

Sur votre ordinateur, ouvrez votre terminal (PowerShell ou Invite de commandes) dans le dossier de votre projet `family-app` et exécutez ces 3 commandes pour envoyer la nouvelle configuration sur GitHub :

```powershell
git add .
git commit -m "Passage en architecture 100% Vercel Serverless (Sans carte bancaire)"
git push origin main
```

---

## ÉTAPE 2 : Déployer en 1 clic sur Vercel *(⏱️ 3 min)*

1. Allez sur **[https://vercel.com](https://vercel.com)** → Cliquez sur **"Sign In"** ou **"Sign Up"** avec **GitHub**. (*Aucune carte de crédit n'est requise*).
2. Cliquez sur le bouton **"Add New..."** en haut à droite → Choisissez **"Project"**.
3. Dans la liste de vos dépôts GitHub, trouvez `Mehdi997/family-app` et cliquez sur le bouton **"Import"**.
4. **Configuration du projet** :
   * **Framework Preset** : Vercel détecte automatiquement le projet grâce aux fichiers `package.json` et `vercel.json`. Laissez par défaut.
   * **Root Directory** : Laissez par défaut (`.` / racine principale).
   * **Build Command** : Laissez par défaut (`npm run build`).

5. **Ajouter les Variables d'Environnement** :
   Dépliez la section **"Environment Variables"** et ajoutez ces clés une par une :

   | Clé (`Key`) | Valeur (`Value`) |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | L'URI complète de votre base **Supabase** *(ex: `postgresql://postgres.xxx:motdepasse@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`)* |
   | `JWT_SECRET` | Une longue chaîne aléatoire *(ex: `a3f7b2c9d8e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5`)* |
   | `JWT_REFRESH_SECRET` | Une autre chaîne aléatoire *(ex: `9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b`)* |
   | `JWT_EXPIRE` | `7d` |
   | `JWT_REFRESH_EXPIRE` | `30d` |

   *(Note : `CLIENT_URL` et `VITE_API_URL` ne sont même plus nécessaires car le frontend et le backend partagent exactement le même domaine sur Vercel !)*

6. Cliquez sur le bouton **"Deploy"**.
7. ⏳ Laissez Vercel compiler l'application React et préparer les fonctions Serverless Express (cela prend environ 1 à 2 minutes).
8. 🎉 **Félicitations !** Des confettis s'affichent ! Votre application familiale est en ligne, ultra-rapide et sécurisée !

---

## ÉTAPE 3 : Tester votre application !

1. Cliquez sur **"Visit"** pour ouvrir votre site (`https://family-app-xxx.vercel.app`).
2. Pour vérifier que l'API et la base de données communiquent parfaitement, ouvrez dans votre navigateur :
   `https://family-app-xxx.vercel.app/api/health`
   👉 Vous devez voir : `{"status":"OK","timestamp":"..."}`
3. Retournez sur l'application, cliquez sur **"Créer un compte"**, saisissez les informations de votre famille, et connectez-vous !

---

## 🔒 Résumé technique des ajouts effectués

* **`vercel.json`** : Route les requêtes `/api/*` et `/uploads/*` vers l'API Serverless Express (`api/index.js`), et les requêtes pages (`/dashboard`, `/calendar`, etc.) vers le React SPA (`client/dist/index.html`).
* **`api/index.js`** : Passerelle légère compatible Vercel qui intercepte les requêtes HTTP et les injecte dans votre serveur Express (`server/server.js`).
* **`api/cron.js`** + **`crons` dans `vercel.json`** : Remplace `node-cron` par le planificateur natif de Vercel (déclenchement quotidien à 8h).
* **`package.json` racine** : Gère l'installation automatique des dépendances (`express`, `pg`, `cors`, etc.) pour les fonctions Vercel et pilote la compilation de Vite.
* **`server/middleware/upload.js`** : Adapté pour écrire dans le dossier temporaire `/tmp` de Vercel Serverless, évitant toute erreur de système de fichiers en lecture seule.
