# 🛍️ SoraCommerce Global

> Une solution e-commerce complète, performante et sécurisée, conçue pour offrir une expérience d'achat fluide aux clients et une gestion intuitive aux administrateurs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)

## 📖 À propos du projet

**SoraCommerce Global** est une application web full-stack développée avec la stack MERN. Elle répond aux besoins modernes du commerce en ligne au Sénégal et à l'international en intégrant des fonctionnalités locales comme les notifications WhatsApp et la gestion des devises (FCFA).

Le projet met l'accent sur :
- **L'expérience utilisateur (UX)** : Interface réactive, design moderne avec Tailwind CSS.
- **La performance** : Chargement rapide des images via Cloudinary et optimisation des requêtes API.
- **La sécurité** : Authentification JWT, hachage des mots de passe et protection des routes admin.

## ✨ Fonctionnalités Détaillées

### 🛒 Côté Client
*   **Navigation Intuitive** : Recherche de produits, filtrage par catégories et mise en avant des nouveautés.
*   **Gestion du Panier** : Persistance du panier, calcul automatique des totaux et mise à jour des quantités.
*   **Processus de Commande** : Formulaire de checkout sécurisé avec validation des données.
*   **Intégration WhatsApp** : Génération automatique d'un message de commande pré-rempli envoyé vers le service client.
*   **Authentification Sociale** : Connexion rapide via Google OAuth.

### 🛡️ Côté Administrateur
*   **Dashboard Sécurisé** : Route protégée accessible uniquement aux utilisateurs ayant le rôle `admin`.
*   **CRUD Produits** : Création, lecture, mise à jour et suppression des articles en temps réel.
*   **Upload d'Images Avancé** : Système d'upload de fichiers locaux convertis et stockés sur Cloudinary pour une disponibilité mondiale.
*   **Suivi des Ventes** : Visualisation de l'historique des commandes et des statuts de paiement.

## 🏗️ Architecture Technique

### Frontend (Client)
*   **Framework** : React 18 avec Vite pour un build ultra-rapide.
*   **Styling** : Tailwind CSS pour un design responsive et moderne.
*   **State Management** : Context API (`AuthContext`, `CartContext`) pour une gestion globale de l'état sans prop-drilling.
*   **Routing** : React Router DOM v6 pour la navigation SPA (Single Page Application).
*   **HTTP Client** : Axios avec intercepteurs pour la gestion des tokens et des erreurs.

### Backend (Serveur)
*   **Runtime** : Node.js avec Express.js.
*   **Base de Données** : MongoDB Atlas (NoSQL) avec Mongoose pour la modélisation des données.
*   **Sécurité** : 
    *   `bcryptjs` pour le hachage des mots de passe.
    *   `cors` pour la gestion des origines croisées.
    *   Validation des entrées utilisateur.
*   **Services Tiers** :
    *   **Cloudinary** : Stockage et optimisation des images produits.
    *   **Multer** : Gestion du multipart/form-data pour l'upload.
    *   **Google OAuth** : Authentification déléguée.

## 🚀 Installation Locale

### Prérequis
*   [Node.js](https://nodejs.org/) (v14 ou supérieur)
*   [Git](https://git-scm.com/)
*   Compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
*   Compte [Cloudinary](https://cloudinary.com/)

### 1. Cloner le dépôt
```bash
git clone https://github.com/souranglamine221-commits/SoraCommerce-Global.git
cd SoraCommerce-Global
