# ALODO USSD Simulator 📱

Un simulateur d'interface USSD (Unstructured Supplementary Service Data) permettant aux utilisateurs de consulter les opportunités disponibles et de postuler directement via un numéro de profil.

## 🎯 Overview

Le système simule un vrai USSD où les utilisateurs peuvent :
- Composer un numéro de profil (ex: `*202#` ou UUID)
- Consulter les opportunités disponibles  
- Voir les prix en FCFA
- Voir les détails de chaque opportunité
- Postuler en quelques taps

## 📁 Structure des fichiers

```
app/
├── demo/
│   ├── page.tsx              # Page d'accueil du démo
│   ├── simulator/
│   │   └── page.tsx          # Interface USSD interactive
│   ├── info/
│   │   └── page.tsx          # Guide d'utilisation
│   └── layout.tsx            # Layout du demo
├── api/
│   └── demo/
│       ├── opportunities/
│       │   └── route.ts      # API pour récupérer les opportunités
│       └── apply/
│           └── route.ts      # API pour soumettre une candidature
```

## 🚀 Fonctionnalités

### 1. **Accueil (/demo)**
- Page de présentation du système USSD
- Explication du fonctionnement
- Lien pour tester le simulateur
- Informations sur les caractéristiques

### 2. **Simulateur (/demo/simulator)**
```
Interface:
┌─────────────────────────┐
│ ALODO USSD *202#       │
├─────────────────────────┤
│ Messages chat           │
├─────────────────────────┤
│ [Input field] [Send]   │
└─────────────────────────┘
```

**Flux utilisateur:**
1. L'utilisateur compose un ID de profil ou `*202#`
2. Le système charge le profil depuis Supabase  
3. Affiche la liste des opportunités avec prix en FCFA
4. L'utilisateur sélectionne une opportunité (numéro)
5. Le système affiche les détails
6. L'utilisateur confirme la candidature avec `1`
7. La candidature est enregistrée dans la base de données

### 3. **API Endpoints**

#### GET `/api/demo/opportunities?profileId={id}`
Récupère les opportunités pour un profil.

**Response:**
```json
{
  "success": true,
  "profile": { /* profile data */ },
  "opportunities": [
    {
      "id": "...",
      "titre": "Développeur Full Stack",
      "institution_nom": "Tech Startup Cotonou",
      "montant_min_fcfa": 500000,
      "montant_max_fcfa": 1500000,
      "date_limite": "2026-04-30",
      "description": "...",
      "score_match": 85,
      "can_apply": true
    }
  ]
}
```

#### POST `/api/demo/apply`
Soumet une candidature.

**Request:**
```json
{
  "profileId": "...",
  "opportunityId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "application": { /* application data */ },
  "message": "Application submitted for..."
}
```

## 💾 Base de données

### Tables utilisées
- `profiles` - Profils utilisateur
- `posts_institution` - Opportunités disponibles
- `scoring_matches` - Scores de compatibilité
- `applications` - Candidatures enregistrées
- `ussd_logs` - Logs des interactions USSD

## 🎨 Design

Le système utilise les couleurs de la marque ALODO:
- **Bleu profond**: `#1a3c6b`
- **Vert Bénin**: `#008751`
- **Jaune Bénin**: `#FCD116`
- **Rouge Bénin**: `#E8112D`

Interface mobile-first, responsive sur tous les appareils.

## 🔄 Flux de données

```
User Input
    ↓
USSD Interface
    ↓
API Route (/api/demo/*)
    ↓
Supabase
    ↓
Response → UI Update
```

## ⚙️ Configuration

Le système utilise:
- **Next.js 16** - Framework React
- **Supabase** - Backend et base de données
- **Lucide Icons** - Icônes UI
- **TypeScript** - Typage statique

## 🧪 Test

Pour tester le système:

1. Aller sur `/demo`
2. Cliquer sur "Essayer maintenant"
3. Composer un ID de profil (UUID) ou entrer `*202#`
4. Naviguer dans les opportunités
5. Sélectionner et postuler

## 📊 Logs USSD

Toutes les actions USSD sont enregistrées dans la table `ussd_logs` avec:
- Action effectuée
- Profile ID
- Post ID
- Timestamp
- Métadonnées additionnelles

## 🔒 Sécurité

- Validation des IDs de profil
- Vérification de l'existence des profils
- Prévention des doublons de candidature
- Authentification Supabase

## 📱 Compatibilité

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile
- ✅ Anciens téléphones (design minimaliste)

## 🚦 États du système

- `entering_profile_id` - Attente du numéro de profil
- `loading_profile` - Chargement du profil
- `viewing_opportunities` - Affichage des opportunités
- `viewing_detail` - Affichage des détails
- `applying` - Traitement de la candidature
- `submitted` - Candidature confirmée

## 📝 Exemple d'utilisation

```
Système: 📱 Bienvenue sur ALODO USSD
         Composez le numéro de votre profil

Utilisateur: 550e8400-e29b-41d4-a716-446655440000

Système: 📞 Chargement du profil...
         
         📋 Vos Opportunités:
         
         1. Développeur Full Stack
            💰 500K - 1.5M FCFA
            🏢 Tech Startup Cotonou
         
         2. Manager de projet
            💰 800K - 2M FCFA
            🏢 Cabinet de Consulting

Utilisateur: 1

Système: 📋 Détails de l'opportunité:
         
         Développeur Full Stack
         
         🏢 Tech Startup Cotonou
         💰 500K - 1.5M FCFA
         📅 Limite: 2026-04-30
         
         📝 Nous recherchons un développeur...
         
         Tapez 1 pour postuler ou 0 pour retour

Utilisateur: 1

Système: 🔄 Traitement de votre candidature...
         ✅ Candidature envoyée avec succès!
         
         🎯 Opportunité: Développeur Full Stack
         💼 Tech Startup Cotonou
         
         Vous serez contacté(e) dans les 24 heures.
         Tapez 0 pour retourner au menu
```

## 🔮 Améliorations futures

- [ ] Support du paiement via Mobile Money
- [ ] Notifications push
- [ ] Historique des candidatures
- [ ] Profil utilisateur personnalisé
- [ ] Recommandations IA basées sur le matching
- [ ] Support multilingue avancé
- [ ] Voice USSD (synthèse vocale)

## 📞 Support

Pour toute question ou bug, veuillez consulter la documentation principale d'ALODO ou contacter l'équipe de développement.
