# 💧 AquaGuard : Tableau de Bord de Détection de Fuites d'Eau

**AquaGuard** est un système de surveillance du débit d'eau et de détection de fuites en temps réel. Il intègre une configuration matérielle **ESP32** avec un tableau de bord moderne **React/Vite** et un backend **Node.js** pour fournir une surveillance intelligente et des alertes de fuite immédiates.

---

## 🚀 Fonctionnalités Clés

- **📉 Surveillance du Débit en Temps Réel** : Visualisation des débits entrant (flow_up) et sortant (flow_down) à l'aide de graphiques haute performance (Recharts).
- **⚠️ Détection de Fuites Intelligente** : Logique sophistiquée qui détecte les fuites mineures et majeures en fonction des écarts de débit et du volume cumulé perdu.
- **🛠️ Intégration ESP32** : Réception fluide des données des capteurs matériels via une API REST dédiée.
- **📊 Historique et Journaux** : Journaux détaillés des événements de débit avec la possibilité d'exporter les données pour une analyse plus approfondie.
- **🌓 Mode Sombre** : Interface utilisateur premium et moderne avec un support complet pour les esthétiques sombres et claires.
- **📑 Tableau de Bord Multi-Pages** : Comprend un moniteur en temps réel, une vue de l'historique et une page "À Propos" pour la documentation du projet.

---

## 🛠️ Stack Technique

### Frontend
- **Framework** : [React 19](https://react.dev/)
- **Outil de Build** : [Vite](https://vitejs.dev/)
- **Style** : [Tailwind CSS](https://tailwindcss.com/)
- **Graphiques** : [Recharts](https://recharts.org/)
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Routage** : [React Router](https://reactrouter.com/)

### Backend
- **Runtime** : [Node.js](https://nodejs.org/)
- **Framework** : [Express.js](https://expressjs.com/)
- **Base de données** : Porté de SQLite vers un historique en mémoire (pour la performance) avec des options de persistance.

### IOT / Matériel
- **Carte** : ESP32
- **Capteurs** : Capteurs de débit d'eau (type YF-S201)
- **Logique** : Implémentation C++ personnalisée dans [iot/iot.ino](file:///c:/Users/hp/Documents/dashboard/iot/iot.ino).

---

## 📦 Installation et Configuration

### 1. Prérequis
- Node.js (v18+)
- npm ou yarn

### 2. Cloner et Installer les Dépendances
```bash
git clone <url-du-depot>
cd dashboard
npm install
```

### 3. Configuration de l'Environnement
Créez un fichier `.env` à la racine du projet :
```env
PORT=3000
# Ajoutez d'autres variables d'environnement ici
```

### 4. Lancement du Projet

#### Développement (Hot-Reload)
```bash
npm run dev
```

#### Lancement du Serveur Backend
```bash
node server.js
```

---

## 📐 Logique de Détection
Le système utilise un **Facteur de Compensation** de `1.045` pour le capteur en aval afin de tenir compte de la friction mécanique et de la chute de pression.

- **Normal** : Les flux sont équilibrés à moins de 100 ml/min.
- **Avertissement** : perte cumulée > 500 ml ou perte instantanée > 800 ml/min.
- **Critique** : perte instantanée > 2000 ml/min.

---

## 📜 Licence
Ce projet est sous licence MIT - voir le fichier [LICENSE](file:///c:/Users/hp/Documents/dashboard/LICENSE) pour plus de détails.

