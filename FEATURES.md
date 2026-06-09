# État des fonctionnalités — Alɔdó Platform

Dernière mise à jour : 9 juin 2026

Ce document décrit l'état actuel de chaque fonctionnalité du site. Chaque section explique ce qui fonctionne, ce qui est en cours, et ce qui reste à faire.

---

## Page d'accueil publique

**État : Terminée**

La page d'accueil est entièrement fonctionnelle. Elle présente la mission d'Alɔdó, explique les problèmes des TPE béninoises, et invite les visiteurs à s'inscrire ou à installer l'application sur leur téléphone. Tout le contenu est affiché correctement et les boutons d'action fonctionnent.

---

## Inscription et création de profil

**État : Terminée**

Le parcours d'inscription est complet. L'utilisateur choisit sa langue (Français, Fon ou Yoruba), son type de profil (Vendeur ou Prestataire), puis renseigne ses informations personnelles étape par étape : numéro de téléphone, secteur d'activité, localisation dans le Bénin, besoins en financement. À la fin, un résumé est présenté avant la validation.

---

## Hub profil (tableau de bord personnel)

**État : Terminé**

Une fois connecté, l'utilisateur accède à son espace personnel. Il voit son nom, son rôle, et des raccourcis vers toutes les fonctionnalités disponibles selon son profil. Le bouton de déconnexion fonctionne.

---

## Assistant administratif Bénin — Formalisation

**État : Terminé**

Cette page est un chatbot d'assistance administrative pour les démarches au Bénin. L'utilisateur pose sa question (par texte, image ou message vocal) et l'IA répond avec une explication claire et les étapes à suivre. Des suggestions rapides sont proposées au démarrage : carte d'identité, passeport, acte de naissance, CNSS. L'assistant peut aussi renvoyer vers un lien officiel si disponible.

L'API associée utilise Gemini 2.5 Flash avec un système de retry automatique en cas d'erreur. Elle répond en JSON structuré avec le texte de réponse, les démarches à suivre, et un lien éventuel.

---

## Démo USSD (simulation téléphonique)

**État : Terminée**

Cette page simule un menu téléphonique comme ceux qu'on utilise avec les codes USSD (ex. \*202#). L'utilisateur voit un vrai rendu de téléphone à l'écran. Il peut naviguer dans les menus, écouter des messages vocaux sur les opportunités disponibles, et tester le service comme si il était sur son téléphone.

---

## Opportunités de financement

**État : Terminée**

L'utilisateur peut consulter les offres publiées par les institutions (microcrédits, subventions, appuis). Chaque offre affiche un score de compatibilité avec son profil. Il peut voir les détails d'une offre et soumettre sa candidature directement depuis le site.

---

## Portefeuille (gestion des crédits reçus)

**État : Terminé**

L'utilisateur voit tous les crédits qu'il a reçus des institutions. Pour chaque crédit, il voit le montant total, ce qu'il a déjà remboursé, ce qu'il reste à rembourser, et la date d'échéance (en rouge si elle est dépassée). Il peut initier un remboursement directement depuis cette page, et le paiement est traité via mobile money.

---

## Tendances du marché

**État : Terminée**

Cette section présente des analyses du marché pour aider l'utilisateur à mieux comprendre son secteur. Elle est divisée en quatre onglets :
- **Prix du marché** : fourchettes de prix avec indicateurs de hausse ou baisse
- **Concurrence** : nombre d'acteurs, parts de marché, niveau de concurrence
- **Tendances** : opportunités et risques à surveiller avec un horizon temporel
- **Réglementation** : obligations légales et recommandations BCEAO

Le contenu est disponible en Français, Fon et Yoruba.

---

## Dashboard Vendeur

**État : Structure présente, contenu non finalisé**

Les pages du tableau de bord Vendeur existent dans le site (catalogue produits, ajout de produit, transactions, rapports), mais leur contenu fonctionnel n'est pas encore développé. On accède aux pages mais elles n'affichent pas encore de vraies données ni de vraies actions.

---

## Dashboard Prestataire

**État : Structure présente, contenu non finalisé**

Même situation que pour le Vendeur. Les pages existent (projets, documents, transactions, historique) mais ne sont pas encore opérationnelles. La navigation fonctionne, mais les fonctionnalités réelles sont à compléter.

---

## Mode Simple

**État : Structure présente, contenu non finalisé**

Le mode simplifié (pour les utilisateurs qui n'ont pas besoin de toutes les fonctionnalités) a ses pages en place, mais elles ne sont pas encore remplies. La calculatrice et l'historique de transactions restent à développer.

---

## Espace Institution

**État : Terminé**

Les institutions (banques, microfinances, ONG) ont leur propre espace complet :
- Une page de présentation publique avec les avantages de la plateforme
- Une connexion sécurisée
- Un tableau de bord pour gérer leurs offres
- Un formulaire pour créer une nouvelle offre (avec génération automatique de résumé en plusieurs langues par l'IA)
- Une section finance pour voir et envoyer des crédits aux utilisateurs via mobile money

---

## Paiements (Moneroo)

**État : Terminé**

L'intégration avec le service de paiement Moneroo est en place. Les institutions peuvent envoyer de l'argent directement sur le mobile money des utilisateurs (MTN, Orange). Les utilisateurs peuvent rembourser leurs crédits via le même système. Les transactions sont enregistrées et vérifiées automatiquement.

---

## Intelligence artificielle (Gemini)

**État : Terminé**

Deux fonctions IA sont actives sur le site :
1. L'assistant administratif Bénin (démarches, documents officiels) dans la section Formalisation
2. La génération de résumés multilingues pour les offres des institutions

Les deux sont stables. La deuxième intègre une protection contre les abus (limite de 5 requêtes par minute).

---

## Application mobile (PWA)

**État : Terminée**

Le site peut être installé comme une application sur smartphone. Un bouton d'installation apparaît sur la page d'accueil. Une fois installé, le site fonctionne comme une vraie application, sans avoir besoin de passer par un store.

---

## Résumé

| Ce qui est terminé | Ce qui est en cours | Ce qui reste à faire |
|--------------------|---------------------|----------------------|
| Landing page | Assistant CV (Formalisation) | Dashboard Vendeur |
| Inscription | Intégration IA Gemini | Dashboard Prestataire |
| Hub profil | | Mode Simple |
| Démo USSD | | |
| Opportunités | | |
| Portefeuille | | |
| Tendances marché | | |
| Espace Institution | | |
| Paiements Moneroo | | |
| PWA (installation) | | |
