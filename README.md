# ENSIT JE — Gestion Qualité Backend

## Démarrage local

```bash
npm install
node server.js
```

Puis ouvrir `index.html` dans le navigateur.

## Déploiement Railway (gratuit)

1. Pousser ce dossier sur GitHub
2. Sur railway.app → New Project → Deploy from GitHub
3. Ajouter les variables d'environnement :
   - `ADMIN_PASSWORD` = votre mot de passe
   - `DATABASE_URL` = (automatique si vous ajoutez PostgreSQL Railway)
4. Ajouter une base PostgreSQL : New → Database → PostgreSQL
5. Copier l'URL Railway → la coller dans index.html (champ URL serveur)

## Rôles

| Rôle | Accueil | NC | Réclamations | Actions |
|------|---------|-----|--------------|---------|
| Utilisateur | ✅ | Créer + voir les siennes | Créer + voir les siennes | ❌ |
| Administrateur | ✅ KPIs | Voir toutes (pas créer) | Voir toutes (pas créer) | Créer + gérer |

## Mot de passe admin par défaut
`ensit2024`
