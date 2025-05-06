# Padel Bolt App

Application de réservation de courts de padel avec intégration du système de paiement Lomi.

## Configuration requise

- Node.js v16 ou supérieur
- Compte Supabase
- Compte Lomi pour les paiements

## Installation

1. Clonez ce dépôt
2. Installez les dépendances:
   ```bash
   npm install
   ```
3. Créez un fichier `.env` basé sur le fichier `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Remplissez les variables d'environnement dans le fichier `.env` avec vos propres clés

## Configuration de Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Exécutez les migrations SQL pour configurer votre base de données
3. Configurez les fonctions Edge dans votre projet Supabase:
   - `lomi_create_session`: Sert de proxy pour créer des sessions de paiement Lomi
   - `lomi_webhook`: Gère les callbacks de Lomi pour mettre à jour le statut des paiements

## Configuration de Lomi

1. Créez un compte sur [Lomi](https://lomi.africa)
2. Obtenez votre clé API Lomi
3. Configurez les variables d'environnement Lomi dans votre fichier `.env`

## Fonctions Edge Supabase

Pour les fonctions Edge de Supabase, vous devez configurer les variables d'environnement dans l'interface de Supabase:

1. LOMI_API_URL: URL de l'API Lomi (généralement https://api.lomi.africa)
2. LOMI_SECRET_KEY: Votre clé secrète Lomi
3. SUPABASE_URL: L'URL de votre projet Supabase
4. SUPABASE_SERVICE_ROLE_KEY: La clé de service de votre projet Supabase

## Développement local

```bash
npm run dev
```

## Intégration Lomi

L'application utilise Lomi comme système de paiement avec Wave comme méthode de paiement par défaut. En développement local, un mode de simulation est activé automatiquement pour faciliter les tests sans effectuer de vrais paiements.

### Mode Simulation

En mode local ou lorsque le paramètre `simulation` est défini à `true` lors de la création d'une session de paiement, l'application utilise une page de simulation au lieu d'appeler l'API Lomi. Cela vous permet de tester le flux de paiement sans utiliser de vrais moyens de paiement.

### Mode Production

En production, l'application utilise les fonctions Edge de Supabase comme proxy pour contourner les problèmes CORS lors des appels à l'API Lomi.
