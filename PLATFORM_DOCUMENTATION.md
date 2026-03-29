# 📱 ALODO Platform - Documentation Complète

## Table of Contents
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Flux Utilisateur - Vendeur/Prestataire](#flux-utilisateur---vendeurprestataire)
4. [Flux Utilisateur - Institution](#flux-utilisateur---institution)
5. [Système de Matching](#système-de-matching)
6. [Base de Données](#base-de-données)
7. [Authentification](#authentification)
8. [Stack Technologique](#stack-technologique)

---

## Vue d'ensemble

**ALODO** est une plateforme de mise en relation entre **micro-entreprises (MPME)** et **institutions financières** au Bénin. 

### 🎯 Objectifs Principaux:
- **Pour les MPME (vendeurs/prestataires)**: Accéder à des opportunités de financement, d'achats de stocks, ou de services adaptés à leur profil
- **Pour les Institutions**: Cibler et atteindre directement les MPME les plus pertinentes pour leurs produits/services
- **Matching Intelligent**: Algorithme qui associe les profils MPME aux offres institutionnelles en fonction de critères détaillés

### 👥 Deux Types d'Utilisateurs:
1. **Vendeurs & Prestataires** (MPME): S'enregistrent avec leur profil d'activité
2. **Institutions** (Finances, Fournisseurs): Publient des offres ciblées avec critères de sélection

---

## Architecture Technique

### Schéma Global:
```
┌─────────────────────────────────────────────────────────┐
│                    ALODO Landing (Next.js)              │
├─────────────────────────────────────────────────────────┤
│  Frontend (React/TSX)   ← → Backend (Server Components) │
├─────────────────────────────────────────────────────────┤
│    Supabase (Auth + Postgres) ← → Database + SQL        │
└─────────────────────────────────────────────────────────┘
```

### Répertoire Principal:

```
alodo-landing/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Groupe de routes d'authentification
│   │   └── login/
│   ├── (onboarding)/              # Groupe d'onboarding
│   │   └── langue/                # ← Point d'entrée principal
│   ├── (dashboard)/               # Dashboard utilisateur
│   │   ├── (archetypes)/          # Vendeur & Prestataire
│   │   ├── (modules)/             # Analytics, Opportunities
│   │   └── simple/
│   ├── opportunites/              # Feed d'opportunités
│   ├── institutions/              # Pages institutionnelles
│   ├── formalisation/
│   └── layout.tsx
├── src/
│   ├── lib/
│   │   ├── supabase/              # Clients Supabase
│   │   │   ├── browser.ts         # Client singleton pour pages client
│   │   │   ├── server.ts          # Client serveur (placeholder)
│   │   │   └── admin.ts           # Client admin (singleton)
│   │   ├── profiles/              # Logique de profil
│   │   │   ├── matching.ts        # Helpers & validation
│   │   │   ├── matching-options.ts # Constantes de matching
│   │   │   └── access.ts          # Gestion des rôles
│   │   ├── analytics/
│   │   ├── utils/
│   │   └── constants/
│   ├── services/                  # Services métier
│   ├── types/                     # Types TypeScript
│   ├── domain/                    # Entités domaine
│   ├── hooks/
│   └── i18n/                      # Traductions (FR, FON, YOR)
├── supabase/                      # Migrations SQL & RLS
│   ├── migrations/
│   ├── functions/
│   └── rls/
├── public/                        # Assets statiques
├── types/                         # Types globaux
└── package.json
```

---

## Flux Utilisateur - Vendeur/Prestataire

### 📝 Étape 1: Page `/langue` (Onboarding)

**URL**: `/app/(onboarding)/langue/page.tsx`

#### Objective:
Collecter le profil complet d'une MPME pour créer un matching intelligent.

#### Étapes du Flux:

**Step 1️⃣ - Connexion (Connexion)**
- Email + Mot de passe
- Si utilisateur nouveau → Sign-up en Supabase Auth
- Si utilisateur existant → Connection directe

**Step 2️⃣ - Langue (Langue)**
- Choix de la langue: Français 🟢, Fon 🟡, Yoruba 🔴
- Synthèse vocale intégrée pour accessibilité
- Format: 3 cartes colorées (déjà visible à `LANGUAGES` array)

**Step 3️⃣ - Identité (Identite)**
- **Téléphone Bénin**: Format validé `01XXXXXXXX`
- **Type d'Activité**: 
  - 🟢 Vendeur (Boutique, Marché, Ambulant, Grossiste)
  - 🔵 Prestataire (Couture, Coiffure, Réparation, Services numériques)
- **Archetype**: Sous-catégorie spécifique du type d'activité

**Step 4️⃣ - Activité (Activite)**
- **Secteur**: Commerce, Services, Agriculture, Restauration
- **Sous-secteur**: Dépend du secteur (ex: Alimentaire, Habillement)
- **Département Bénin**: 12 départements
- **Commune**: Dépend du département (ex: Alibori → Banikoara, Gogounou...)

**Step 5️⃣ - Besoins (Besoins)**
- **Revenu Mensuel Estimé**: 4 tranches de revenus
  - < 100K FCFA
  - 100K - 300K FCFA
  - 300K - 700K FCFA
  - > 700K FCFA
- **Besoin Principal**: Acheter du stock, Matériel, Trésorerie, Formalisation
- **Documents Possédés**: Sélection checkbox des pièces (P.I., IFU, RCCM, etc.)

**Step 6️⃣ - Résumé (Resume)**
- Récapitulatif de tous les choix
- Validation avant soumission
- Button "Enregistrer le profil" → Sauvegarde en base de données

#### Points Clés:

1. **Speech Synthesis**: Chaque étape a une description vocale
2. **Validation en Temps Réel**: Les valeurs saisies sont validées contre les constantes de `matching-options.ts`
3. **States Persistants**: Les choix restent disponibles lors de la navigation

---

### 📱 Après Onboarding: Dashboard Vendeur/Prestataire

**URLs**: 
- `/app/(dashboard)/(archetypes)/vendeur/` (Dashboards vendeur)
- `/app/(dashboard)/(archetypes)/prestataire/` (Dashboard prestataire)

#### Fonctionnalités:
- **Profile Completion**: Possibilité de mettre à jour le profil
- **Historique**: Consulter les transactions passées
- **Rapports**: Génération de rapport d'activité
- **Transactions**: Suivi des transactions en cours
- **Documents**: Gestion des documents

---

### 🎯 Flux d'Opportunités

**URL**: `/app/opportunites/page.tsx`

#### Objective:
Afficher à l'utilisateur les opportunités qui correspondent à son profil.

#### Process:
1. **Authentification**: 
   - Récupère la session utilisateur (`supabase.auth.getSession()`)
   - Attend la hydratation du cookie de session
   - Redirige vers `/institutions/login` si pas connecté

2. **Récupération du Profil**:
   - Query: `SELECT id FROM profiles WHERE user_id = ?`
   - Récupère l'ID du profil utilisateur

3. **Matching via DB**:
   - Query: `SELECT * FROM post_institution_matches WHERE profile_id = ? ORDER BY score DESC`
   - Tableau `post_institution_matches` contient les matchs pré-calculés par le moteur de matching SQL

4. **Récupération des Postes**:
   - Query: `SELECT * FROM post_institutions WHERE id IN (...)`
   - Récupère les détails complets des postes correspondants

5. **Affichage Groupé**:
   - **Très Pertinentes** (`niveau = 'tres_pertinent'`): Match score très élevé
   - **Pertinentes** (`niveau = 'pertinent'`): Match score modéré
   - **Peut Postuler** (`can_apply = true`): Tous les documents requis sont présents
   - **Ne Peut Pas Postuler** (`can_apply = false`): Documents manquants

#### Données de Match Affichées:
- `score`: Score de compatibilité (0-100)
- `niveau`: Catégorie de pertinence
- `matching_reasons`: Array de raisons du match
- `missing_documents`: Array de documents nécessaires mais manquants
- `can_apply`: Boolean indiquant si l'utilisateur peut candidater

---

## Flux Utilisateur - Institution

### 🏢 Page d'Accueil: `/institutions`

**URL**: `/app/institutions/page.tsx`

#### Contenu:
- Description de l'espace institutions
- CTA: "Se Connecter" ou "Créer un Post"
- Présentation des features

#### Authentification:
- Vérification du rôle: `profile.role === 'admin'`
- Redirection différente selon le rôle

---

### 🔐 Login Institution: `/institutions/login`

**URL**: `/app/institutions/login/page.tsx`

#### Process:
1. Email + Mot de passe
2. Validation: L'utilisateur doit avoir `role = 'admin'`
3. Redirection vers `/institutions/dashboard`

#### Protection:
- Vérification qu'aucun utilisateur non-admin ne peut accéder à la page

---

### 📊 Dashboard Institution: `/institutions/dashboard`

**URL**: `/app/institutions/dashboard/page.tsx`

#### Affichage:
- **Statistiques**: Posts totaux, Publiés, Brouillons
- **Liste des Posts**: Tous les postes publiés par l'institution
- **Bouton**: "Créer un nuevo post" → `/institutions/dashboard/nouveau`

#### Data Model:
```typescript
type InstitutionPost = {
  id: string;
  titre: string;
  description: string;
  statut: "publie" | "brouillon";
  types_concernes: string[]; // ["vendeur", "prestataire"]
  secteurs_concernes: string[]; // ["commerce", "services"]
  montant_min_fcfa: number | null;
  montant_max_fcfa: number | null;
  date_limite: string | null;
  created_at: string;
};
```

---

### ✍️ Créer un Post: `/institutions/dashboard/nouveau`

**URL**: `/app/institutions/dashboard/nuevo/page.tsx`

#### Objective:
Créer et publier une opportunité ciblée vers des profils MPME spécifiques.

#### Champs du Formulaire:

**Section 1: Informations de Base**
- `titre`: Nom de l'opportunité
- `description`: Détails complets de l'opportunité
- `lien_externe`: URL vers plus d'infos (optionnel)

**Section 2: Ciblage**
- `types_concernes[]`: Vendeur et/ou Prestataire
- `secteurs_concernes[]`: Multi-sélection (Commerce, Services, Agriculture, Restauration)
- `sous_secteurs_concernes[]`: Dépend des secteurs sélectionnés
- `communes_concernees[]`: Villes visées
- `archetypes_concernes[]`: Types d'activités spécifiques

**Section 3: Critères Financiers**
- `revenu_min_estime_fcfa`: Revenu minimal cible
- `revenu_max_estime_fcfa`: Revenu maximal cible
- `montant_min_fcfa`: Montant minimum de l'offre
- `montant_max_fcfa`: Montant maximum de l'offre

**Section 4: Documents & Conditions**
- `documents_requis[]`: Pièces justificatives nécessaires
- `besoins_financement_concernes[]`: Types de besoins (Stock, Équipement, Trésorerie, Formalisation)
- `date_limite`: Date limite de candidature

**Section 5: Contact**
- `contact_nom`: Nom du contact
- `contact_telephone`: Téléphone institution
- `contact_email`: Email institution
- `statut`: "publie" (publié) ou "brouillon"

#### Process de Sauvegarde:
1. Validation des champs obligatoires
2. Récupération de l'ID du profil institution (admin)
3. Insertion en DB: `INSERT INTO post_institutions (...)`
4. Trigger DB: Déclenche le calcul des matchs via `refresh_all_post_institution_matches()`

---

## Système de Matching

### 🎯 Système de Financement Intelligent

### ⚡ Type de Traitement (Auto vs Manuel)

Chaque opportunité créée par une institution peut être configurée avec deux modes de traitement:

#### 1. **Financement Automatique** (`type_traitement = "auto"`)
- Les demandes sont approuvées **instantanément** si le score de réputation de l'utilisateur atteint le minimum
- **Champ**: `score_minimum_auto` (0-10)
- **Workflow**:
  - Utilisateur positionne sa demande
  - Fonction RPC `check_financement_eligibility()` appelée
  - Si `profile.reputation_score >= post.score_minimum_auto` → **Approuvé ✅**
  - Sinon → **En attente de révision ⏳**

#### 2. **Financement Manuel** (`type_traitement = "manuel"`)
- Les demandes sont toujours soumises à révision manuelle par l'institution
- L'institution décide d'approuver ou rejeter chaque demande via le dashboard

---

### 📋 Table `financements`

Enregistre les candidatures des utilisateurs:

```sql
CREATE TABLE financements (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL,           -- FK → profiles
  post_id UUID NOT NULL,              -- FK → post_institutions
  institution_profile_id UUID NOT NULL, -- FK → profiles (admin)
  montant_demande INTEGER NOT NULL,   -- Montant demandé par utilisateur
  montant_accorde INTEGER,            -- Montant approuvé (si approuvé)
  statut TEXT CHECK (statut IN ('pending', 'approved', 'rejected')),
  message_demande TEXT,               -- Message du candidat
  decision_comment TEXT,              -- Commentaire de l'institution
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 🔄 Fonction RPC: `check_financement_eligibility()`

```sql
-- Vérifie si une candidature doit être approuvée automatiquement
SELECT check_financement_eligibility(
  p_profile_id := profile.id,
  p_post_id := post.id
) :: text;

-- Retourne: 'approved' ou 'pending'
```

**Logique:**
- Si `post.type_traitement = 'auto'` ET `profile.reputation_score >= post.score_minimum_auto`
  - Retourne: `'approved'`
- Sinon
  - Retourne: `'pending'`

---

## 🎯 Pages d'Opportunités (Candidature)

### `/opportunites/[id]` - Détails de l'Opportunité

**URL**: `/app/opportunites/[id]/page.tsx`

#### Features:
- ✅ Affichage complet de l'opportunité
- ✅ Score de pertinence du candidat
- ✅ Informations financières (montant min/max, durée, taux)
- ✅ Conditions requises et documents nécessaires
- ✅ Raisons du matching
- ✅ Badge d'admissibilité ("Vous pouvez postuler" ou "Non postulable")
- ✅ CTA: Bouton "Postuler maintenant"

#### Données Affichées:
```typescript
type PostInstitution = {
  id: string;
  titre: string;
  description: string;
  montant_min_fcfa?: number;
  montant_max_fcfa?: number;
  duree_mois?: number;
  taux_interet?: number;
  type_traitement?: "auto" | "manuel";      // 🆕
  score_minimum_auto?: number;               // 🆕
  date_limite?: string;
  lieu?: string;
  secteur?: string;
  conditions?: string[];
  documents_requis?: string[];
  created_at: string;
};
```

**Conditions de Financement** (section nouvelle):
- Si `type_traitement === "auto"`:
  - "⚡ Financement automatique disponible si votre score ≥ {score_minimum_auto}"
- Sinon:
  - "👤 Financement soumis à validation de l'institution"

---

### `/opportunites/[id]/postuler` - Formulaire de Candidature 🆕

**URL**: `/app/opportunites/[id]/postuler/page.tsx`

#### Workflow Complet:

**Step 1: Charge les données**
```typescript
// Récupérer le profil (avec reputation_score)
const profile = await supabase
  .from("profiles")
  .select("id, phone, reputation_score, archetype, secteur")
  .eq("user_id", user.id)
  .maybeSingle();

// Récupérer l'opportunité
const post = await supabase
  .from("post_institutions")
  .select("*")
  .eq("id", postId)
  .maybeSingle();
```

**Step 2: Affiche le formulaire**
- Montant demandé (saisie numérique)
- Message de motivation (textarea)
- Info du profil (score de réputation, secteur)
- Réaumé des conditions d'éligibilité automatique

**Step 3: À la soumission, appelle la fonction RPC**
```typescript
// Vérifier l'éligibilité
const { data: statut } = await supabase.rpc(
  'check_financement_eligibility',
  {
    p_profile_id: profile.id,
    p_post_id: post.id
  }
);
// statut = 'approved' ou 'pending'
```

**Step 4: Insère dans la table `financements`**
```typescript
const { data: financement } = await supabase
  .from('financements')
  .insert({
    profile_id: profile.id,
    post_id: post.id,
    institution_profile_id: post.institution_profile_id,
    montant_demande: Number(montantDemande),
    statut: statut,  // 'approved' ou 'pending'
    message_demande: messageDemande
  })
  .select()
  .maybeSingle();
```

**Step 5: Affiche le résultat**
- Si `statut === 'approved'`:
  - ✅ "Financement approuvé instantanément!"
  - Affiche montant et référence
- Si `statut === 'pending'`:
  - ⏳ "Votre demande est en cours de traitement"
  - "Un conseiller examinera votre demande et vous contactera bientôt"

#### UX Features:
- Affichage du score de réputation utilisateur
- Validation du montant (min/max de l'opportunité)
- Loader pendant le traitement
- Modal de confirmation avec détails
- Redirection automatique après 2-3 secondes

---

## 💰 Wallet (Finance personnelle) 🆕

### `/wallet` - Dashboard Portefeuille

**URL**: `/app/wallet/page.tsx`

#### Features:
- Solde disponible (principal)
- Historique des transactions (dépôts, transferts)
- Boutons rapides: "Dépôt" et "Transfert"
- Informations pratiques

#### Structure:
```typescript
type WalletSession = {
  id: string;
  type: "dépôt" | "transfert" | "retrait";
  montant: number;
  date: string;
  statut: "en_cours" | "terminé" | "échoué";
};
```

---

### `/wallet/deposit` - Effectuer un Dépôt

**URL**: `/app/wallet/deposit/page.tsx`

#### Formulaire:
- Montant (saisie numérique)
- Méthode de paiement:
  - 📱 Mobile Money (MTN, Moov, Vodafone)
  - 💳 Carte Bancaire
  - 🏦 Virement Bancaire
- Résumé avec frais (1% par défaut)

#### Workflow:
1. Utilisateur saisit montant et choisit méthode
2. Affichage du résumé (montant + frais)
3. Confirmation
4. Simulation de traitement (2s)
5. Success screen avec redirection vers wallet

---

### `/wallet/transfer` - Effectuer un Transfert

**URL**: `/app/wallet/transfer/page.tsx`

#### Formulaire:
- Destinataire (numéro teléphone ou email)
- Montant (saisie numérique)
- Motif (textarea optiona)
- Réaumé avec frais (2% par défaut)
- Validation du solde

#### Workflow:
1. Validations (solde suffisant, numéro valide)
2. Affichage du résumé
3. Confirmation
4. Traitement
5. Success screen

---

## 🏛️ Dashboard Institution - Gestion Financements

### `/institutions/dashboard/finance` - Vue d'ensemble 🆕

**URL**: `/app/institutions/dashboard/finance/page.tsx`

#### Affichage:
- **Principal**: Liste de tous les posts créés par l'institution
- Pour chaque post:
  - Nombre total de candidats
  - Nombre de candidats "En attente" (badge jaune)
  - Nombre approuvés (vert)
  - Nombre rejetés (rouge)

#### Éléments Interactifs:
- **Accordion/Expansion** de chaque post
- Affichage des candidats groupés par statut

---

### Structure des Candidats Affichés

**Pour chaque candidat**:
```typescript
type Applicant = {
  id: string;
  financement_id: string;
  phone: string;
  secteur: string;
  sous_secteur: string;
  montant_demande: number;
  reputation_score: number;
  statut: "pending" | "approved" | "rejected";
  message_demande: string;
  created_at: string;
};
```

**Carte de candidat affiche**:
- 📱 Téléphone
- 🏢 Secteur / Sous-secteur
- 💰 Montant demandé
- ⭐ Score de réputation
- 🏷️ Statut (badge coloré)

**Actions** (si statut = "pending"):
- ✅ Bouton "Approuver" (rapide)
- ❌ Bouton "Rejeter" (rapide)
- 📋 Clic sur la carte pour voir les détails complets

---

### Modal Détails du Candidat

Affiche:
- Téléphone
- Secteur / Sous-secteur
- Score de réputation
- Montant demandé
- Message de candidature
- **Actions** (si pending):
  - Approuver = Update `financements.statut = 'approved'` + set `montant_accorde`
  - Rejeter = Update `financements.statut = 'rejected'` + optional comment

---

### API Updates Effectuées

#### Approuver une candidature:
```typescript
const { error } = await supabase
  .from("financements")
  .update({
    statut: "approved",
    montant_accorde: applicant.montant_demande
  })
  .eq("id", applicant.financement_id);
```

#### Rejeter une candidature:
```typescript
const { error } = await supabase
  .from("financements")
  .update({
    statut: "rejected",
    decision_comment: reason
  })
  .eq("id", applicant.financement_id);
```

---

## 🆕 Amélioration: Institution Crear Opportunity

### `/institutions/dashboard/nuevo/page.tsx` - Mise à Jour

**Nouveaux champs ajoutés**:

#### Type de Traitement du Financement:
```typescript
form.type_traitement: "auto" | "manuel"     // NEW
form.score_minimum_auto: string             // NEW (visible si auto)
```

**UI**:
- Select dropdown: "👤 Manuel" ou "⚡ Automatique"
- Sous-champ "Score minimum" (0-10) visible seulement si "auto"
- Aide texte explicative:
  - "Manuel": "Les demandes seront examinées manuellement par votre équipe"
  - "Auto": "Les demandes seront approuvées automatiquement si le score atteint le minimum"

**Payload d'insertion**:
```typescript
const payload = {
  // ... autres champs ...
  type_traitement: form.type_traitement,
  score_minimum_auto: form.type_traitement === "auto" 
    ? toNullableNumber(form.score_minimum_auto) 
    : null,
  // ... autres champs ...
};
```

---

Le matching est calculé **côté serveur** via des fonctions SQL/PL/pgSQL.

#### Fonctions Principales:

**1. `compute_post_profile_match(post_id, profile_id)`**
- Calcule un score de compatibilité entre un post et un profil
- Renvoie: `score`, `niveau`, `matching_reasons`, `missing_documents`, `can_apply`

**2. `refresh_matches_for_post(post_id)`**
- Recalcule tous les matchs pour un post donné
- Appelé après création/modification d'un post

**3. `refresh_matches_for_profile(profile_id)`**
- Recalcule tous les matchs pour un profil donné
- Appelé après création/modification d'un profil

**4. `refresh_all_post_institution_matches()`**
- Recalcule TOUS les matchs (full refresh)
- Coûteuse, utilisée rarement

#### Constantes du Matching:

Définies dans `src/lib/profiles/matching-options.ts`:

```typescript
// Types et Archétypes
MATCHING_ARCHETYPES = {
  vendeur: [
    { id: "boutique", label: "Boutique" },
    { id: "marche", label: "Marche" },
    // ...
  ],
  prestataire: [
    { id: "couture", label: "Couture" },
    // ...
  ]
};

// Secteurs & Sous-Secteurs
MATCHING_SECTORS = [
  {
    id: "commerce",
    subSectors: ["Alimentaire", "Habillement", "Cosmétiques", ...]
  },
  // ...
];

// Besoin de financement
MATCHING_FUNDING_NEEDS = [
  { id: "stock", label: "Acheter du stock" },
  { id: "equipement", label: "Acheter du materiel" },
  // ...
];

// Documents requis
MATCHING_DOCUMENTS = [
  { id: "piece_identite", label: "Piece d'identite" },
  { id: "ifu", label: "IFU" },
  // ...
];

// Géographie
BENIN_DEPARTMENTS = [
  {
    id: "alibori",
    communes: ["Banikoara", "Gogounou", "Kandi", ...]
  },
  // ...
];
```

#### Logique de Matching:

**Score = Somme pondérée if:**
- Type correspond ✅
- Secteur match ✅
- Commune/Département match ✅
- Revenu estimé dans la plage cible ✅
- Tous les documents requis présents ✅

**Niveaux:**
- `tres_pertinent`: Score > 85
- `pertinent`: Score 50-85
- `possible`: Score 25-50
- `faible`: Score < 25

**can_apply Flag:**
- `true` si tous les `missing_documents` sont vides
- `false` sinon

---

## Base de Données

### 📋 Tables Principales:

#### 2. `post_institutions` (UPDATED)
```sql
- id (UUID, PK)
- institution_profile_id (UUID, FK → profiles)
- titre (TEXT)
- description (TEXT)
- types_concernes (TEXT[])
- secteurs_concernes (TEXT[])
- sous_secteurs_concernes (TEXT[])
- communes_concernees (TEXT[])
- archetypes_concernes (TEXT[])
- revenu_min_estime_fcfa (INTEGER)
- revenu_max_estime_fcfa (INTEGER)
- montant_min_fcfa (INTEGER)
- montant_max_fcfa (INTEGER)
- documents_requis (TEXT[])
- besoins_financement_concernes (TEXT[])
- date_limite (DATE)
- statut: "publie" | "brouillon"
- contact_nom (TEXT)
- contact_telephone (TEXT)
- contact_email (TEXT)
- lien_externe (TEXT)
- type_traitement (TEXT) -- NEW: "auto" | "manuel"
- score_minimum_auto (INTEGER) -- NEW: 0-10 (null si manuel)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. `post_institution_matches`
```sql
- id (UUID, PK)
- post_institution_id (UUID, FK → post_institutions)
- profile_id (UUID, FK → profiles)
- score (INTEGER) -- 0-100
- niveau: "tres_pertinent" | "pertinent" | "possible" | "faible"
- matching_reasons (TEXT[]) -- Array
- missing_documents (TEXT[]) -- Array
- can_apply (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. `financements` (NEW)
```sql
- id (UUID, PK)
- profile_id (UUID, FK → profiles)
- post_id (UUID, FK → post_institutions)
- institution_profile_id (UUID, FK → profiles)
- montant_demande (INTEGER)
- montant_accorde (INTEGER, nullable)
- statut: "pending" | "approved" | "rejected"
- message_demande (TEXT, nullable)
- decision_comment (TEXT, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 5. `transactions` (Optional)
```sql
- id (UUID, PK)
- profile_id (UUID, FK → profiles)
- post_id (UUID, FK → post_institutions)
- montant (INTEGER)
- statut: "en_cours" | "termine" | "annule"
- created_at (TIMESTAMP)
```

### 🔒 Row Level Security (RLS):

**Fichier**: `supabase/rls/`

**Règles principales:**
- Users ne voient que leurs propres données
- Admins voient tous les posts de leur institution
- Matching table: Select-only pour users, read/write pour admin

---

## Authentification

### 🔑 Supabase Auth

**Client Supabase Centralisé**: `src/lib/supabase/browser.ts`
```typescript
const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### Session Management:

**Récupération de Session**:
```typescript
const { data: sessionData } = await supabase.auth.getSession();
const user = sessionData?.session?.user;
```

**Écoute des changements**:
```typescript
supabase.auth.onAuthStateChange((_event, session) => {
  const user = session?.user;
  // Réagir au changement
});
```

**Sign-up**:
```typescript
supabase.auth.signUp({
  email,
  password,
  // Crée automatiquement un user dans auth.users
});
```

**Sign-in**:
```typescript
supabase.auth.signInWithPassword({
  email,
  password,
});
```

**Sign-out**:
```typescript
supabase.auth.signOut();
```

### 📱 Flux d'Authentification:

1. **Sign-up (`/langue` - Step 1)**:
   - Utilisateur entre email + mot de passe
   - `supabase.auth.signUp()` → Crée user en `auth.users`
   - Crée automatiquement entrée correspondante en `profiles`

2. **Login Admin (`/institutions/login`)**:
   - Email + Mot de passe
   - `supabase.auth.signInWithPassword()`
   - Vérification: `profile.role === "admin"`

3. **Session Persistence**:
   - Token stocké localement (localStorage/cookies)
   - `getSession()` hydirate la session au chargement de la page
   - `onAuthStateChange()` écoute les modifications

---

## Stack Technologique

### 📚 Frontend:
- **Framework**: Next.js 16+ (App Router)
- **Langage**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + CSS inline (colors)
- **Icons**: Lucide React
- **Audio**: Web Speech API (synthèse vocale)

### 🗄️ Backend:
- **Auth**: Supabase Auth (PostgreSQL)
- **Database**: PostgreSQL avec Supabase
- **Functions**: SQL / PL/pgSQL pour le matching
- **API**: RESTful via Supabase API

### 🔧 Development:
- **Package Manager**: npm
- **Linter**: ESLint
- **Build Tool**: Turbopack (Next.js)
- **Version Control**: Git

### 📦 Dependencies Clés:
```json
{
  "@supabase/supabase-js": "^2.33.0",
  "react": "^18.x",
  "next": "^16.x",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.x"
}
```

---

## 🎯 Prochaines Étapes (Roadmap)

### ✅ Récemment Complété:
- ✅ Implémentation du système de financement intelligent (auto/manuel)
- ✅ RPC pour vérifier l'éligibilité automatique
- ✅ Page d'application `/opportunites/[id]/postuler` avec intégration RPC
- ✅ Dashboard institution pour gérer les financements
- ✅ Wallet avec dépôt et transferts
- ✅ Champs type_traitement et score_minimum_auto dans création de post

### Court Terme:
- [ ] Testing complet du workflow de financement
- [ ] Intégration réelle des paiements (Mobile Money)
- [ ] SMS de notification pour les décisions de financement

### Moyen Terme:
- [ ] Historique complet du wallet
- [ ] Système de scoring avancé (basé sur comportement)
- [ ] Dashboard analytics pour institutions
- [ ] Rappels automatiques pour applications expirées

### Long Terme:
- [ ] Machine Learning pour le matching
- [ ] Prévisions de remboursement
- [ ] Assurance crédit intégrée
- [ ] Mobile app native

---

## 📞 Support

Pour des questions sur l'architecture ou l'implémentation, référez-vous aux fichiers source ou à ce document.

**Dernière mise à jour**: 29 Mars 2026
