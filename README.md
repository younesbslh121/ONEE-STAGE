# Fleet Management System

Système de gestion de flotte avec géolocalisation avancée

## 🚀 Déploiement sur GitHub Pages

Ce projet est automatiquement déployé sur GitHub Pages via GitHub Actions.

### URL de déploiement
- **Site web**: https://younesbslh121.github.io/ONEE-STAGE

### Configuration automatique
- Le déploiement se fait automatiquement à chaque push sur la branche `main`
- Le workflow GitHub Actions construit et déploie le frontend
- Aucune configuration manuelle n'est nécessaire

## 📋 Utilisation

### Démarrage propre
Ce système a été configuré pour un démarrage propre :
- **Aucun véhicule prédéfini** n'est créé automatiquement
- Vous devez ajouter vos véhicules manuellement via l'interface
- Les missions ne peuvent être créées qu'après avoir ajouté des véhicules

### Gestion des véhicules

#### Ajouter un véhicule
1. Accédez à la page "Véhicules"
2. Cliquez sur "Ajouter un véhicule"
3. Remplissez les informations (plaque, marque, modèle, etc.)
4. Sauvegardez

#### Supprimer tous les véhicules
Si vous voulez repartir de zéro :
```bash
# Depuis le répertoire backend
python clear_vehicles.py
```

#### Via l'API (pour les développeurs)
```bash
# Supprimer tous les véhicules
curl -X POST http://localhost:5000/api/vehicles/noauth/clear-vehicles

# Ajouter un véhicule
curl -X POST http://localhost:5000/api/vehicles/noauth \
  -H "Content-Type: application/json" \
  -d '{
    "license_plate": "AB-123-CD",
    "brand": "Renault",
    "model": "Clio",
    "year": 2022,
    "color": "Bleu",
    "fuel_type": "gasoline"
  }'
```

## 🛠️ Développement

### Installation
```bash
# Installer toutes les dépendances
npm run install-all

# Démarrer le serveur de développement
npm run dev
```

### Structure du projet
```
fleet-management/
├── frontend/          # Application React
├── backend/           # API Flask
├── .github/workflows/ # GitHub Actions
└── README.md
```

### Scripts utiles
```bash
# Démarrer le backend uniquement
npm run backend

# Démarrer le frontend uniquement
npm run frontend

# Construire pour la production
npm run build

# Nettoyer les véhicules
cd backend && python clear_vehicles.py
```

## 📱 Fonctionnalités

- 🚗 **Gestion de flotte** : Ajout, modification, suppression de véhicules
- 📍 **Géolocalisation** : Suivi en temps réel des véhicules
- 📋 **Missions** : Planification et suivi des missions
- 👥 **Utilisateurs** : Gestion des conducteurs et administrateurs
- 📊 **Tableau de bord** : Vue d'ensemble des KPIs
- 🗺️ **Cartes interactives** : Visualisation sur carte Leaflet

## 🔧 Configuration

### Variables d'environnement
Créez un fichier `.env` dans le répertoire backend :
```env
FLASK_ENV=development
DATABASE_URL=sqlite:///fleet.db
JWT_SECRET_KEY=your-secret-key
```

### GitHub Pages
La configuration GitHub Pages est automatique :
- Le site est publié sur la branche `gh-pages`
- L'URL est configurée dans `frontend/package.json`
- Le workflow GitHub Actions gère le déploiement

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité
3. Commitez vos changements
4. Pushez vers la branche
5. Ouvrez une Pull Request

## 📄 License

Ce projet est sous licence MIT.
