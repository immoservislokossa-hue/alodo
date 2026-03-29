# ALODO Platform - Diagrammes Visuels

## 1️⃣ Flux Principal: Vendeur/Prestataire

```
START
  │
  ├─→ Pas d'authentification?
  │     └─ Redirection /langue
  │
  └─→ Page /langue (Onboarding 6 Steps)
      │
      ├─ Step 1: Connexion (Auth Supabase)
      │   ├─ Email + Password
      │   └─ Sign-up ou Sign-in
      │
      ├─ Step 2: Langue (FR/FON/YOR)
      │   └─ Choix + Text-to-Speech
      │
      ├─ Step 3: Identité
      │   ├─ Téléphone (validation Bénin 01XXXXXXXX)
      │   ├─ Type activité (Vendeur/Prestataire)
      │   └─ Archetype (Boutique, Couture, etc.)
      │
      ├─ Step 4: Activité
      │   ├─ Secteur (Commerce, Services, Agriculture, Restauration)
      │   ├─ Sous-secteur
      │   ├─ Département Bénin
      │   └─ Commune
      │
      ├─ Step 5: Besoins
      │   ├─ Revenu mensuel (4 tranches)
      │   ├─ Besoin principal (Stock, Équipement, Trésorerie, Formalisation)
      │   └─ Documents possédés (checkboxes)
      │
      └─ Step 6: Résumé
          ├─ Récapitulatif de tous les choix
          └─ SAVE → Insérer en DB.profiles
              │
              └─→ Trigger: refresh_matches_for_profile()
                  (Calcule tous les matchs pour ce profil)
                  │
                  └─ Redirige vers Dashboard
                      │
                      ├─ Dashboard Vendeur/Prestataire
                      │   ├─ Historique
                      │   ├─ Projets
                      │   ├─ Transactions
                      │   ├─ Rapports
                      │   └─ Documents
                      │
                      └─→ OU Naviguer vers /opportunites
                          │
                          └─ Page Opportunités (Viewing Matches)
                              │
                              ├─ Très Pertinentes (niveau = 'tres_pertinent')
                              ├─ Pertinentes (niveau = 'pertinent')
                              ├─ Peut Postuler (can_apply = true)
                              └─ Ne Peut Pas Postuler (can_apply = false)

END
```

---

## 2️⃣ Flux Institution: Créer une Offre Ciblée

```
START
  │
  ├─ Utilisateur Institution visitе /institutions
  │   └─ Voit description + "Se Connecter" ou "Créer un Post"
  │
  └─ Login: /institutions/login
      │
      ├─ Email + Password
      ├─ supabase.auth.signInWithPassword()
      ├─ Vérification: profile.role === "admin" ✅
      └─ Redirection: /institutions/dashboard
          │
          └─ Dashboard Institution
              │
              ├─ Affiche: Posts total, Publiés, Brouillons
              ├─ Liste des posts passés
              └─ Button: "Nouveau Post" → /institutions/dashboard/nuevo
                  │
                  └─ Formulaire "Créer une Opportunité"
                      │
                      ├─ Infos de base
                      │   ├─ Titre
                      │   ├─ Description
                      │   └─ Lien externe
                      │
                      ├─ Ciblage (Multi-Select)
                      │   ├─ Types concernés (Vendeur/Prestataire)
                      │   ├─ Secteurs concernés
                      │   ├─ Sous-secteurs concernés
                      │   ├─ Communes concernées
                      │   └─ Archétypes concernés
                      │
                      ├─ Critères Financiers
                      │   ├─ Revenu min/max estimé
                      │   ├─ Montant min/max de l'offre
                      │   └─ Date limite
                      │
                      ├─ Documents & Conditions
                      │   ├─ Documents requis
                      │   ├─ Besoins de financement
                      │   └─ Contact (nom, tel, email)
                      │
                      └─ SAVE
                          │
                          ├─ Validation des champs
                          ├─ INSERT INTO post_institutions (...)
                          │   │
                          │   └─ Reçoit: post.id
                          │
                          └─ Trigger DB: refresh_all_post_institution_matches()
                              │
                              ├─ Pour chaque profil en DB:
                              │   └─ compute_post_profile_match(post.id, profile.id)
                              │       │
                              │       └─ Insère row en post_institution_matches
                              │           ├─ score (0-100)
                              │           ├─ niveau (tres_pertinent/pertinent/possible/faible)
                              │           ├─ matching_reasons (Array)
                              │           ├─ missing_documents (Array)
                              │           └─ can_apply (Boolean)
                              │
                              └─ ✅ Post maintenant visible pour les profils matchés

END
```

---

## 3️⃣ Flux de Matching: De la Création du Post à l'Affichage

```
┌──────────────────────────────────────────────────────────────┐
│                      MATCHING FLOW                           │
└──────────────────────────────────────────────────────────────┘

1. INSTITUTION CRÉE UN POST
   └─ POST_INSTITUTIONS INSERT
       └─ (types_concernes, secteurs_concernes, communes_concernees, etc.)

2. TRIGGER: refresh_all_post_institution_matches() called
   │
   ├─ Loop: for each profile in profiles table
   │   │
   │   └─ Appel: compute_post_profile_match(post_id, profile_id)
   │       │
   │       ├─ Critères de matching:
   │       │   ├─ Profile.type IN post.types_concernes? ✓
   │       │   ├─ Profile.sector IN post.secteurs_concernes? ✓
   │       │   ├─ Profile.department IN post.communes_concernees? ✓
   │       │   ├─ Profile.revenue IN post.revenu_min/max? ✓
   │       │   ├─ Profile.documents_owned ⊇ post.documents_requis? ✓
   │       │
   │       ├─ Calcul du score: SUM(poids × match)
   │       │   └─ Score = 0-100
   │       │
   │       ├─ Attribution du niveau:
   │       │   ├─ score > 85 → "tres_pertinent"
   │       │   ├─ score 50-85 → "pertinent"
   │       │   ├─ score 25-50 → "possible"
   │       │   └─ score < 25 → "faible"
   │       │
   │       ├─ Raison du match:
   │       │   └─ matching_reasons = ["Type match", "Secteur match", ...]
   │       │
   │       ├─ Documents manquants:
   │       │   └─ missing_documents = post.required - profile.owned
   │       │
   │       ├─ Peut postuler?
   │       │   └─ can_apply = (missing_documents.length === 0)
   │       │
   │       └─ INSERT INTO post_institution_matches (...)
   │           └─ Row créée avec tous les calculs

3. USER (VENDEUR/PRESTATAIRE) VISITE /opportunites
   │
   ├─ Récupère le profil de l'utilisateur
   ├─ Query: SELECT * FROM post_institution_matches
   │         WHERE profile_id = ? ORDER BY score DESC
   │
   ├─ Récupère les posts correspondants
   │ (SELECT * FROM post_institutions WHERE id IN (...))
   │
   └─ AFFICHAGE GROUPÉ:
       │
       ├─ Section: "Très Pertinentes" (niveau = 'tres_pertinent')
       │   └─ Pour chaque match:
       │       ├─ Post titre + description
       │       ├─ Score affiché
       │       ├─ Matching Reasons affichées
       │       ├─ Missing Documents affichés (le cas échéant)
       │       └─ Button "Postuler" (enabled si can_apply = true)
       │
       ├─ Section: "Pertinentes" (niveau = 'pertinent')
       │   └─ Même structure que ci-dessus
       │
       ├─ Section: "Peut Postuler" (can_apply = true)
       │   └─ Tous les documents requis présents
       │
       └─ Section: "Ne Peut Pas Postuler" (can_apply = false)
           └─ Affiche les documents manquants + raison

4. USER CLIQUE "Postuler"
   │
   └─ Navigation vers /opportunites/[id]
       └─ Formulaire de candidature (à implémenter)
           ├─ Upload documents manquants
           ├─ Message personnalisé
           └─ SUBMIT candidate
               → INSERT INTO transactions (...)
```

---

## 4️⃣ Architecture de la Base de Données

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                          │
├─────────────────────────────────────────────────────────────────┤
│
│  auth.users (Gérée par Supabase)
│  ├─ id (UUID)
│  ├─ email
│  ├─ password_hash
│  └─ ...
│
├─────────────────────────────────────────────────────────────────┤
│
│  public.profiles (User Profiles)
│  ├─ id (UUID) PK
│  ├─ user_id (FK → auth.users)
│  ├─ role: "user" | "admin"
│  ├─ type: "vendeur" | "prestataire"
│  ├─ archetype
│  ├─ sector
│  ├─ sub_sector
│  ├─ department
│  ├─ commune
│  ├─ estimated_monthly_revenue
│  ├─ funding_needs (JSONB Array)
│  ├─ documents_owned (JSONB Array)
│  └─ created_at, updated_at
│
├─────────────────────────────────────────────────────────────────┤
│
│  public.post_institutions (Institution Posts)
│  ├─ id (UUID) PK
│  ├─ institution_profile_id (FK → profiles)
│  ├─ titre
│  ├─ description
│  ├─ types_concernes (TEXT Array)
│  ├─ secteurs_concernes (TEXT Array)
│  ├─ sous_secteurs_concernes (TEXT Array)
│  ├─ communes_concernees (TEXT Array)
│  ├─ archetypes_concernes (TEXT Array)
│  ├─ revenu_min/max_estime_fcfa
│  ├─ montant_min/max_fcfa
│  ├─ documents_requis (TEXT Array)
│  ├─ besoins_financement_concernes (TEXT Array)
│  ├─ date_limite
│  ├─ statut: "publie" | "brouillon"
│  ├─ contact_nom, contact_tel, contact_email
│  └─ created_at, updated_at
│
├─────────────────────────────────────────────────────────────────┤
│
│  public.post_institution_matches (Matching Results)
│  ├─ id (UUID) PK
│  ├─ post_institution_id (FK → post_institutions)
│  ├─ profile_id (FK → profiles)
│  ├─ score (INTEGER 0-100)
│  ├─ niveau: "tres_pertinent" | "pertinent" | "possible" | "faible"
│  ├─ matching_reasons (TEXT Array)
│  ├─ missing_documents (TEXT Array)
│  ├─ can_apply (BOOLEAN)
│  └─ created_at, updated_at
│
├─────────────────────────────────────────────────────────────────┤
│
│  public.transactions (Optional)
│  ├─ id (UUID) PK
│  ├─ profile_id (FK → profiles)
│  ├─ post_id (FK → post_institutions)
│  ├─ montant
│  ├─ statut: "en_cours" | "termine" | "annule"
│  └─ created_at, updated_at
│
└─────────────────────────────────────────────────────────────────┘
```

---

## 8️⃣ Flux de Candidature: De l'Opportunité à la Décision 🆕

```
USER CONSULTE OPPORTUNITÉS
  │
  └─ Page /opportunites
      ├─ Liste des matchs (groupés par pertinence)
      └─ Pour chaque opportunité:
            │
            ├─ Affiche: score, raisons, documents requis
            └─ Button "Postuler" (enabled si can_apply = true)
                │
                └─ Clic → Navigation vers /opportunites/[id]/postuler
                    │
                    ├─ LOAD DATA:
                    │   ├─ Session check (redirect si not auth)
                    │   ├─ Fetch profile (id, reputation_score, archetype, secteur)
                    │   └─ Fetch post (type_traitement, score_minimum_auto, montant_min/max)
                    │
                    └─ FORMULAIRE CANDIDATURE:
                        │
                        ├─ Affiche info utilisateur
                        │   ├─ "Score de réputation: {reputation_score}/10"
                        │   ├─ "Secteur: {secteur}"
                        │   └─ "Éligibilité auto: {'✅ Vous êtes éligible' | '❌ Non éligible'}"
                        │
                        ├─ Champs saisie:
                        │   ├─ Montant demandé (validation min/max)
                        │   └─ Message de motivation (textarea)
                        │
                        └─ SUBMIT:
                            │
                            ├─ Appel RPC: check_financement_eligibility()
                            │   ├─ params: p_profile_id, p_post_id
                            │   └─ return: 'approved' | 'pending'
                            │
                            ├─ INSERT INTO financements:
                            │   {
                            │     profile_id,
                            │     post_id,
                            │     institution_profile_id,
                            │     montant_demande,
                            │     statut: eligibilityResult,  ← From RPC
                            │     message_demande
                            │   }
                            │
                            └─ AFFICHE RÉSULTAT:
                                │
                                ├─ Si statut = 'approved':
                                │   ├─ ✅ "Financement approuvé instantanément!"
                                │   ├─ Affiche référence
                                │   └─ Auto-redirect après 3s
                                │
                                └─ Si statut = 'pending':
                                    ├─ ⏳ "Votre demande est en cours de traitement"
                                    ├─ "Vous serez contacté bientôt"
                                    └─ Auto-redirect après 3s
```

---

## 9️⃣ Workflow: Finance de l'Institution 🆕

```
INSTITUTION ACCÈS DASHBOARD FINANCE
  │
  └─ Page /institutions/dashboard/finance
      │
      ├─ Query: SELECT post_institutions
      │   WHERE institution_profile_id = current_admin_id
      │
      └─ Pour chaque post:
          │
          ├─ Query: SELECT * FROM financements
          │   WHERE post_id = post.id
          │   AND profile_id JOIN profiles
          │   AND GROUP BY statut
          │
          └─ Affiche POST CARD:
              │
              ├─ Post titre
              ├─ Montant range
              ├─ Type traitement (Auto ⚡ / Manuel 👤)
              ├─ Nombre candidats par statut:
              │   ├─ 🟠 {pending_count} En attente
              │   ├─ 🟢 {approved_count} Approuvés
              │   └─ 🔴 {rejected_count} Rejetés
              │
              └─ [⬇️ EXPANDABLE]
                  │
                  ├─ Section: EN ATTENTE (pending)
                  │   └─ ApplicantCard x N:
                  │       ├─ Phone
                  │       ├─ Secteur / Sous-secteur
                  │       ├─ Montant demandé
                  │       ├─ ⭐ Reputation score
                  │       ├─ [✅ Approuver] [❌ Rejeter]
                  │       └─ Clic card → Modal détails
                  │
                  ├─ Section: APPROUVÉS (approved)
                  │   └─ ApplicantCard x N (read-only)
                  │       └─ Affiche montant_accorde
                  │
                  └─ Section: REJETÉS (rejected)
                      └─ ApplicantCard x N (read-only)
                          └─ Affiche decision_comment
```

---

## 🔟 Modal Détails Candidat 🆕

```
CLIC SUR APPLICANT CARD
  │
  └─ MODAL OPEN:
      │
      ├─ Header: Détails du candidat
      │
      ├─ Section Infos:
      │   ├─ 📱 Téléphone
      │   ├─ 💼 Archetype
      │   ├─ 🏢 Secteur / Sous-secteur
      │   ├─ 📊 Réputation: {reputation_score}/10
      │   └─ 💰 Montant demandé: {montant_demande} FCFA
      │
      ├─ Section Message:
      │   └─ Affiche: {message_demande} (si présent)
      │
      └─ Si statut = 'pending':
          │
          ├─ Form: Décision
          ├─ Radio: [Approuver] [Rejeter]
          ├─ Textarea: Commentaire (optionnel)
          │
          └─ Actions:
              │
              ├─ APPROUVER:
              │   └─ UPDATE financements SET
              │       statut = 'approved',
              │       montant_accorde = montant_demande
              │       WHERE id = financement_id
              │
              └─ REJETER:
                  └─ UPDATE financements SET
                      statut = 'rejected',
                      decision_comment = input_comment
                      WHERE id = financement_id
```

---

## 1️⃣1️⃣ Wallet Flow 🆕

```
USER VISITE /wallet
  │
  ├─ Affiche Solde: {wallet_balance} FCFA
  ├─ Historique Transactions
  │   └─ Type | Date | Montant | Statut
  │
  └─ Quick Actions:
      │
      ├─ Button "Dépôt" → /wallet/deposit
      │   │
      │   └─ Formulaire:
      │       ├─ Montant
      │       ├─ Méthode: [ 📱 Mobile Money ] [ 💳 Carte ] [ 🏦 Virement ]
      │       ├─ Frais: 1%
      │       └─ CONFIRM → Simulation (2s) → Success Redirect
      │
      └─ Button "Transfert" → /wallet/transfer
          │
          └─ Formulaire:
              ├─ Destinataire (Phone/Email)
              ├─ Montant
              ├─ Motif (optional)
              ├─ Validation:
              │   ├─ Solde suffisant?
              │   ├─ Numéro valide?
              │   └─ Montant > 0?
              ├─ Frais: 2%
              └─ CONFIRM → Processing → Success
```

---

## 1️⃣2️⃣ Hiérarchie des Routes 🆕

```
/
├─ (auth)/
│   └─ login/
│
├─ (onboarding)/
│   └─ langue/          ← POINT D'ENTRÉE PRINCIPAL
│
├─ (dashboard)/
│   ├─ (archetypes)/
│   │   ├─ vendeur/
│   │   │   ├─ page.tsx
│   │   │   ├─ documents/
│   │   │   ├─ historique/
│   │   │   ├─ projets/
│   │   │   │   └─ [id]/
│   │   │   ├─ rapports/
│   │   │   └─ transactions/
│   │   └─ prestataire/
│   │       └─ [même structure]
│   ├─ (modules)/
│   │   ├─ analytics/
│   │   ├─ opportunities/
│   │   ├─ scoring/
│   │   └─ transactions/
│   └─ simple/
│       ├─ page.tsx
│       ├─ boitier/
│       └─ historique/
│
├─ opportunites/
│   ├─ page.tsx         ← VIEWING MATCHES + FILTERING
│   └─ [id]/
│       ├─ page.tsx     ← OPPORTUNITY DETAILS
│       └─ postuler/
│           └─ page.tsx ← APPLICATION FORM (NEW)
│
├─ institutions/
│   ├─ page.tsx
│   ├─ login/           ← ADMIN LOGIN
│   └─ dashboard/
│       ├─ page.tsx     ← INSTITUTION DASHBOARD
│       ├─ nuevo/       ← CREATE OPPORTUNITY
│       └─ finance/
│           ├─ page.tsx ← MANAGE APPLICATIONS (NEW)
│           └─ [id]/
│               └─ page.tsx ← APPLICATION DETAILS (NEW - PLACEHOLDER)
│
├─ wallet/             ← NEW SECTION
│   ├─ page.tsx        ← WALLET DASHBOARD (NEW)
│   ├─ deposit/
│   │   └─ page.tsx    ← DEPOSIT FORM (NEW)
│   └─ transfer/
│       └─ page.tsx    ← TRANSFER FORM (NEW)
│
├─ formalisation/
├─ (public)/
│   └─ page.tsx
└─ page.tsx             ← HOME
```

---

## 1️⃣3️⃣ Session & Authentification (Mise à Jour) 🆕

```
FLOW D'AUTHENTIFICATION COMPLET

┌─────────────────────────────────────┐
│       VENDEUR / PRESTATAIRE         │
└─────────────────────────────────────┘

1. VISITE PAGE:
   └─ ANY_PAGE checks: getSession()
       ├─ Si session trouvée:
       │   ├─ Set user
       │   └─ Affiche contenu
       │
       └─ Si pas session:
           ├─ Set loading = true
           ├─ Wait 400ms (session hydration)
           └─ Redirect /langue

2. PAGES PROTÉGÉES:
   ├─ /wallet/*
   ├─ /opportunites/*
   ├─ /(dashboard)/*
   └─ Requirent (session.user exists)

┌─────────────────────────────────────┐
│       INSTITUTION / ADMIN           │
└─────────────────────────────────────┘

1. VISITE /institutions/login:
   ├─ Email + Password
   ├─ supabase.auth.signInWithPassword()
   ├─ Check: profile.role === "admin"
   └─ If OK → Redirect /institutions/dashboard

2. PAGES PROTÉGÉES:
   ├─ /institutions/dashboard/*
   ├─ /institutions/dashboard/nuevo/*
   ├─ /institutions/dashboard/finance/*
   └─ Requirent (role === "admin")
```

---

**Schéma créé/mis à jour**: 29 Mars 2026

```
┌─────────────────────────────────────────────────────────────┐
│         CONSTANTES: src/lib/profiles/matching-options.ts    │
└─────────────────────────────────────────────────────────────┘

MATCHING_PROFILE_TYPES
  └─ ["vendeur", "prestataire"]

MATCHING_ARCHETYPES
  ├─ vendeur:
  │   ├─ boutique
  │   ├─ marche
  │   ├─ ambulant
  │   └─ grossiste
  └─ prestataire:
      ├─ couture
      ├─ coiffure
      ├─ reparation
      └─ services_numeriques

MATCHING_SECTORS
  ├─ commerce
  │   └─ [Alimentaire, Habillement, Cosmetiques, Pieces détachées, Divers]
  ├─ services
  │   └─ [Couture, Coiffure, Reparation, Transport, Numerique]
  ├─ agriculture
  │   └─ [Production vegetale, Elevage, Transformation locale, Distribution]
  └─ restauration
      └─ [Cuisine de rue, Restaurant, Boissons, Traiteur]

BENIN_DEPARTMENTS (12 total)
  ├─ alibori → [Banikoara, Gogounou, Kandi, Karimama, Malanville, Segbana]
  ├─ atacora → [9 communes]
  ├─ atlantique → [8 communes]
  ├─ borgou → [8 communes]
  ├─ collines → [6 communes]
  ├─ couffo → [6 communes]
  ├─ donga → [4 communes]
  ├─ littoral → [Cotonou]
  ├─ mono → [6 communes]
  ├─ oueme → [9 communes]
  ├─ plateau → [5 communes]
  └─ zou → [9 communes]

MATCHING_FUNDING_NEEDS
  ├─ stock: "Acheter du stock"
  ├─ equipement: "Acheter du materiel"
  ├─ tresorerie: "Renforcer la tresorerie"
  └─ formalisation: "Formaliser mon activite"

MATCHING_DOCUMENTS
  ├─ piece_identite
  ├─ ifu
  ├─ rccm
  ├─ cip
  ├─ preuve_adresse
  ├─ justificatif_activite
  ├─ releve_mobile_money
  └─ releve_bancaire
```

---

## 6️⃣ Constantes de Matching Utilisées

```
┌─────────────────────────────────────────────────────────┐
│         CONSTANTES: src/lib/profiles/matching-options.ts    │
└─────────────────────────────────────────────────────────┘

MATCHING_PROFILE_TYPES
  └─ ["vendeur", "prestataire"]

MATCHING_ARCHETYPES
  ├─ vendeur:
  │   ├─ boutique
  │   ├─ marche
  │   ├─ ambulant
  │   └─ grossiste
  └─ prestataire:
      ├─ couture
      ├─ coiffure
      ├─ reparation
      └─ services_numeriques

MATCHING_SECTORS
  ├─ commerce
  │   └─ [Alimentaire, Habillement, Cosmetiques, Pieces détachées, Divers]
  ├─ services
  │   └─ [Couture, Coiffure, Reparation, Transport, Numerique]
  ├─ agriculture
  │   └─ [Production vegetale, Elevage, Transformation locale, Distribution]
  └─ restauration
      └─ [Cuisine de rue, Restaurant, Boissons, Traiteur]

BENIN_DEPARTMENTS (12 total)
  ├─ alibori → [Banikoara, Gogounou, Kandi, Karimama, Malanville, Segbana]
  ├─ atacora → [9 communes]
  ├─ atlantique → [8 communes]
  ├─ borgou → [8 communes]
  ├─ collines → [6 communes]
  ├─ couffo → [6 communes]
  ├─ donga → [4 communes]
  ├─ littoral → [Cotonou]
  ├─ mono → [6 communes]
  ├─ oueme → [9 communes]
  ├─ plateau → [5 communes]
  └─ zou → [9 communes]

MATCHING_FUNDING_NEEDS
  ├─ stock: "Acheter du stock"
  ├─ equipement: "Acheter du materiel"
  ├─ tresorerie: "Renforcer la tresorerie"
  └─ formalisation: "Formaliser mon activite"

MATCHING_DOCUMENTS
  ├─ piece_identite
  ├─ ifu
  ├─ rccm
  ├─ cip
  ├─ preuve_adresse
  ├─ justificatif_activite
  ├─ releve_mobile_money
  └─ releve_bancaire
```

---

## 7️⃣ État d'Authentification

```
┌──────────────────────────────┐
│   SESSION STATE FLOW         │
└──────────────────────────────┘

NO USER
  │
  ├─ Visite /langue
  └─ Voit "Connexion" step
      │
      └─ Saisit email + password
          │
          ├─ supabase.auth.signUp()
          │   ├─ Crée user en auth.users
          │   └─ Crée profile en profiles
          │
          ├─ OU supabase.auth.signInWithPassword()
          │   └─ Active session existante
          │
          └─ setUserId(user.id)
              └─ Continue onboarding

USER LOGGED IN
  │
  ├─ Session active (getSession())
  ├─ userId disponible
  ├─ Peut accéder /opportunites
  ├─ Voit le dashboard
  │
  └─ Clique "Logout"
      └─ supabase.auth.signOut()
          └─ Session terminée
              └─ Retour à /langue

SESSION HYDRATION
  │
  ├─ Page charge: isLoading = true
  ├─ Appel: getSession()
  │   ├─ Si session trouvée → setUser()
  │   └─ Si pas de session → setTimeout(400ms)
  │
  ├─ Écoute: onAuthStateChange()
  │   └─ Attend la hydratation du cookie
  │
  └─ isLoading = false
      └─ Affiche le contenu ou redirige
```

---

**Schéma créé**: 29 Mars 2026
