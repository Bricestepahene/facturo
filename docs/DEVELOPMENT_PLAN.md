# Facturo — Plan de Développement Jour par Jour

**Durée totale estimée : 40 jours ouvrables**  
**Référence :** Issues GitHub #1–#30  
**Architecte :** Claude Code (Anthropic)  
**Dernière mise à jour :** 2026-06-11

---

## Vue d'ensemble des phases

| Phase | Titre | Jours | Issues |
|---|---|---|---|
| 1 | Setup & Infrastructure | J1–J3 | #1, #2, #3, #26 |
| 2 | Couche données (Types + Store) | J4–J6 | #4, #5 |
| 3 | CRUD — Clients, Produits, Paramètres | J7–J13 | #9, #10, #11 |
| 4 | Éditeur de documents | J14–J18 | #7, #14 |
| 5 | Liste, Dashboard, Onboarding | J19–J21 | #6, #8, #19 |
| 6 | Moteur PDF | J22–J26 | #12, #13 |
| 7 | Monétisation | J27–J31 | #15, #16, #17, #18 |
| 8 | Fonctions avancées | J32–J35 | #24, #25, #29 |
| 9 | Store & CI/CD | J36–J40 | #20, #21, #22, #23, #27, #28, #30 |

---

## Phase 1 — Setup & Infrastructure (J1–J3)

### Jour 1 — Init Expo + TypeScript + Navigation [#1]

**Objectif :** Projet fonctionnel qui se lance sur Android.

Tâches :
- `npx create-expo-app facturo --template expo-template-blank-typescript`
- Configurer `tsconfig.json` (strict: true, paths aliases `@/`)
- Installer React Navigation v6 : `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/stack`
- Créer la structure de dossiers `src/` complète (voir CLAUDE.md)
- Créer `AppNavigator.tsx` avec 5 onglets placeholder (Dashboard, Documents, Clients, Produits, Paramètres)
- Configurer ESLint + Prettier
- Vérification : `npx expo start` → app visible dans Expo Go

Livrable : app qui se lance avec 5 onglets vides.

---

### Jour 2 — Dépendances principales [#2]

**Objectif :** Toutes les bibliothèques installées et configurées.

Packages à installer :
```bash
npm install zustand @react-native-async-storage/async-storage
npm install react-hook-form @hookform/resolvers zod
npm install i18next react-i18next expo-localization
npm install expo-print expo-sharing expo-file-system
npm install react-native-google-mobile-ads
npm install expo-in-app-purchases
npm install @react-native-community/datetimepicker
npm install react-native-pdf
```

Tâches :
- Initialiser i18n (`src/i18n/index.ts`, `en.json`, `fr.json` avec namespace structure)
- Configurer AdMob (test mode) dans `app.json`
- Vérifier les peer dependencies
- Corriger les éventuels conflits de versions

Livrable : build Android sans erreurs.

---

### Jour 3 — EAS Build + Design System [#3, #26]

**Objectif :** Build Android signé en place, tokens de design définis.

Tâches :
- `npm install -g eas-cli && eas init`
- Configurer `eas.json` (profiles: development, preview, production)
- Générer keystore Android via EAS
- Créer `src/theme/colors.ts` — palette principale (primary, secondary, surface, error, warning, success)
- Créer `src/theme/typography.ts` — fontSizes (xs/sm/md/lg/xl/2xl), fontWeights
- Créer `src/theme/spacing.ts` — scale 4px (4, 8, 12, 16, 20, 24, 32, 40, 48)
- Créer composants de base : `Button`, `Input`, `Card`, `Badge`, `Divider`, `EmptyState`
- Icônes : `@expo/vector-icons` (Ionicons)

Livrable : `eas build --platform android --profile preview` réussit.

---

## Phase 2 — Couche Données (J4–J6)

### Jour 4 — Types TypeScript [#4]

**Objectif :** Tous les modèles de données typés et documentés.

Fichiers à créer :
- `src/types/document.types.ts` — `Document`, `LineItem`, `Discount`, `TaxLine`, `DocumentType`, `DocumentStatus`
- `src/types/client.types.ts` — `Client`, `ClientSnapshot`, `Address`
- `src/types/product.types.ts` — `Product`
- `src/types/settings.types.ts` — `CompanySettings`, `TaxRate`
- `src/types/currency.types.ts` — `CurrencyConfig` + liste complète des 150+ devises ISO 4217
- `src/utils/calculations.ts` — fonctions `calculateLineItem`, `calculateDocument` (pures, testables)
- `src/utils/currency.ts` — `formatCurrency(amount, config)`, `getCurrencyConfig(code)`, `SUPPORTED_CURRENCIES`
- `src/utils/invoiceNumber.ts` — `generateInvoiceNumber(prefix, year, counter)`

Tests unitaires :
- `calculations.test.ts` : cas TVA 20%, remise %, remise fixe, multi-taxes
- `currency.test.ts` : formatage EUR, XAF (0 décimales), USD

Livrable : 0 erreur TypeScript, tests verts.

---

### Jour 5 — Stores Zustand [#5]

**Objectif :** Toute la logique d'état encapsulée et persistée.

Fichiers à créer :
- `src/store/clientsStore.ts` — CRUD clients + search
- `src/store/productsStore.ts` — CRUD produits + search
- `src/store/documentsStore.ts` — CRUD documents + filtres + `convertQuoteToInvoice()`
- `src/store/settingsStore.ts` — CompanySettings + TaxRates + compteurs numérotation
- `src/store/usageStore.ts` — compteur PDF/mois + reset mensuel + état isPro

Chaque store :
- Middleware `persist` avec AsyncStorage
- Types stricts, pas de `any`
- Actions testables en isolation

Livrable : stores fonctionnels, données persistées entre relancements.

---

### Jour 6 — Données de démo + utilitaires [bonus]

**Objectif :** App utilisable immédiatement au premier lancement.

Tâches :
- `src/utils/seedData.ts` — données exemples (2 clients, 3 produits, 1 devis, 1 facture)
- Injecter au premier lancement (flag `hasSeeded` dans settingsStore)
- `src/utils/dateUtils.ts` — formatDate, addDays, isOverdue, startOfMonth
- Compléter les fichiers i18n `en.json` et `fr.json` pour les namespaces : `common`, `document`, `client`, `product`, `settings`, `pdf`

---

## Phase 3 — CRUD Screens (J7–J13)

### Jour 7–8 — Gestion des Clients [#9]

**Objectif :** Créer, modifier, supprimer, rechercher des clients.

Écrans :
- `ClientListScreen` : liste avec `FlatList`, barre de recherche, bouton FAB « + »
- `ClientFormScreen` : formulaire react-hook-form + Zod
  - Champs : nom, type (individuel/entreprise), email, téléphone, adresse, pays (picker), n° fiscal, RCCM/SIRET
  - Validation : email format, téléphone optionnel, nom requis
  - Mode création et édition
- Confirmation de suppression via modal

Composants à extraire :
- `CountryPicker` — picker ISO 3166 avec recherche
- `ClientCard` — card avec nom, email, dernière activité

Livrable : flux complet créer/modifier/supprimer/rechercher client.

---

### Jour 9–10 — Gestion des Produits/Services [#10]

**Objectif :** Catalogue produits réutilisable dans les documents.

Écrans :
- `ProductListScreen` : liste avec recherche, catégories
- `ProductFormScreen` : désignation, description, prix unitaire, unité (picker : h, kg, pcs, jour, forfait, etc.), catégorie optionnelle

Composants :
- `UnitPicker` — liste d'unités prédéfinies + saisie libre
- `ProductCard`

Livrable : catalogue gérable, prêt à être utilisé dans l'éditeur.

---

### Jour 11–13 — Paramètres & Profil Entreprise [#11]

**Objectif :** Configuration complète de l'entreprise et des défauts.

Écrans :
- `SettingsScreen` : menu principal (Profil entreprise, Taux de TVA, Devises, Sauvegarde, Upgrade Pro)
- `CompanyProfileScreen` :
  - Logo (picker galerie + aperçu)
  - Nom, adresse, téléphone, email, site web
  - N° fiscal, n° d'immatriculation
  - Devise par défaut (recherche parmi 150+ ISO 4217)
  - Langue par défaut (FR/EN)
  - Préfixe et numéro de départ : factures et devis
  - Délai de paiement par défaut (jours)
  - Mentions légales
  - Coordonnées bancaires
- `TaxRatesScreen` : liste des taux configurés + CRUD
  - Nom libre, taux %, défaut oui/non, composé oui/non

Livrable : paramètres complets, persistés, appliqués par défaut dans les nouveaux documents.

---

## Phase 4 — Éditeur de Documents (J14–J18)

### Jour 14–16 — DocumentEditorScreen [#7]

**Objectif :** Cœur de l'application — créer/modifier un devis ou une facture.

Sections de l'écran :
1. **En-tête** : type (devis/facture), numéro (auto + éditable), date, date d'échéance
2. **Client** : `ClientPicker` (autocomplétion + création rapide inline)
3. **Lignes** : `FlatList` de `LineItemRow`
   - Description, quantité, prix unitaire, unité
   - Remise par ligne (% ou fixe)
   - Taux de TVA applicables (multi-select depuis les taux configurés)
   - Totaux calculés en temps réel
   - Bouton supprimer ligne
   - Bouton « Ajouter depuis catalogue » (ProductPicker)
4. **Résumé financier** :
   - Sous-total
   - Remise globale (% ou fixe)
   - Lignes de taxes (regroupées par taux)
   - **TOTAL** (large)
5. **Pied** : notes, conditions, langue du PDF, devise du document
6. **Actions** : Aperçu PDF, Enregistrer, Envoyer

Auto-save brouillon toutes les 10 secondes.

Composants à créer :
- `LineItemRow` — ligne éditable avec swipe pour supprimer
- `ClientPicker` — modal de recherche avec création inline
- `ProductPicker` — modal catalogue
- `TaxRateSelector` — multi-select des taux
- `DiscountInput` — toggle % / fixe + valeur
- `CurrencySelector` — picker devise avec recherche
- `FinancialSummary` — bloc récapitulatif recalculé en temps réel

Livrable : création d'une facture complète avec calculs corrects.

---

### Jour 17–18 — Conversion Devis → Facture + Duplication [#14]

**Objectif :** Actions documents avancées.

Fonctionnalités :
- **Duplication** : copie exacte du document, nouveau numéro, statut brouillon
- **Conversion devis → facture** :
  1. Confirmation utilisateur (modal)
  2. Nouvel ID, type='invoice', statut='draft'
  3. Nouveau numéro (séquence factures)
  4. Date = aujourd'hui, échéance = aujourd'hui + délai par défaut
  5. Copie de tous les items, client snapshot, devise, taxes
  6. `convertedFromId` sur la nouvelle facture
  7. `convertedToId` + statut='converted' sur le devis original
- Indicateur visuel "Converti le {date}" sur le devis source
- Lien vers la facture créée depuis le devis

Livrable : conversion fonctionnelle, audit trail préservé.

---

## Phase 5 — Liste, Dashboard, Onboarding (J19–J21)

### Jour 19 — DocumentListScreen [#8]

**Objectif :** Vue globale de tous les documents avec filtres et actions rapides.

Fonctionnalités :
- Onglets : Tous / Devis / Factures
- Filtres : statut, plage de dates, client
- Recherche par numéro ou nom client
- `DocumentCard` : numéro, client, montant formaté, statut (color-coded), date
- Swipe actions : partager PDF, dupliquer, supprimer
- Statuts : Brouillon (gris) / Envoyé (bleu) / Payé (vert) / En retard (rouge) / Converti (violet)
- FAB « + » → choix Devis ou Facture

Livrable : liste filtrée, navigation vers éditeur.

---

### Jour 20 — DashboardScreen [#6]

**Objectif :** Vue d'accueil avec KPIs et accès rapide.

Widgets :
- Compteurs : nombre de devis en attente, factures impayées, total encaissé ce mois
- 5 documents récents avec statut
- Boutons action rapide : Nouveau devis, Nouvelle facture
- Alertes : factures en retard (badge rouge)

Livrable : dashboard fonctionnel avec données réelles des stores.

---

### Jour 21 — OnboardingScreen [#19]

**Objectif :** Première expérience utilisateur guidée.

Fonctionnalités :
- 3 slides (Swiper) : présentation fonctionnalités clés
- Slide finale : mini-formulaire pour remplir le nom de l'entreprise et la devise par défaut
- Bouton « Commencer » → naviguer vers Dashboard
- Flag `hasSeenOnboarding` en AsyncStorage — ne s'affiche qu'une fois
- Bouton « Passer » disponible

Livrable : onboarding complet, skip possible.

---

## Phase 6 — Moteur PDF (J22–J26)

### Jour 22–24 — Générateur PDF [#12]

**Objectif :** PDF professionnel généré depuis les données du document.

Fichiers :
- `src/services/pdf/pdfTemplate.ts` — fonction pure `buildPdfHtml(doc, company, t)` → HTML string
- `src/services/pdf/pdfGenerator.ts` — `generatePdf(html)` → file URI via expo-print

Structure HTML du PDF :
```
Header:
  Logo entreprise (base64) | Informations entreprise
  Titre "FACTURE" ou "DEVIS" (selon type)
  Numéro, Date, Échéance

Client:
  Bloc "Facturé à" avec snapshot client

Tableau des lignes:
  Colonnes : Description | Qté | Unité | P.U. | Remise | Total HT
  Total par ligne

Résumé financier:
  Sous-total HT
  Remise globale (si applicable)
  Lignes de taxes
  TOTAL TTC (large, gras)

Pied de page:
  Mentions légales | Coordonnées bancaires
  RCCM, NIU, n° fiscal (si renseignés)
  Page X / Y

Filigrane:
  "BROUILLON" / "DRAFT" en diagonale si statut = draft
```

Internationalisation du PDF :
- Labels en FR ou EN selon `document.language`
- Format de date selon la langue
- Formatage monétaire selon `document.currency`

Livrable : PDF propre sur device Android, testé avec logo et sans logo.

---

### Jour 25 — PDFPreviewScreen + Partage [#13]

**Objectif :** Prévisualiser et distribuer le PDF.

Fonctionnalités :
- `PDFPreviewScreen` : rendu inline via `react-native-pdf` ou WebView
- Bouton Partager → `expo-sharing` → WhatsApp, Gmail, Telegram, etc.
- Bouton Télécharger → copie dans Documents de l'appareil
- Bouton Imprimer → `expo-print.printAsync`
- Bouton Retour vers édition

Livrable : flux complet génération → prévisualisation → partage.

---

### Jour 26 — Intégration Ad-Gate dans le flux PDF [#16]

**Objectif :** Brancher la monétisation sur la génération PDF.

Logique :
```
generateAndSharePdf(document):
  1. usageStore.canGeneratePdfDirectly()
     → true: générer directement
     → false: afficher AdGateModal
        ├── "Regarder une pub (30 sec)" → loadRewardedAd() → show() → onAdClose → générer
        └── "Passer à Pro" → navigate UpgradeProScreen

  2. Si génération OK: usageStore.incrementPdfCount()
```

Composants :
- `AdGateModal` — modal avec compteur mensuel visible, 2 options
- `usageStore.canGeneratePdfDirectly()` — compare compteur vs limite
- `usageStore.incrementPdfCount()` — +1 avec reset mensuel automatique

Livrable : ad-gate fonctionnel, jamais bloquant.

---

## Phase 7 — Monétisation (J27–J31)

### Jour 27 — AdMob — Pubs Rewarded + Banner [#15]

**Objectif :** Publicités intégrées proprement.

Implémentation :
- `src/services/monetization/adService.ts`
  - `loadRewardedAd()` — précharge la pub au démarrage de l'app
  - `showRewardedAd()` → Promise résolu quand l'utilisateur a regardé 30 secondes
  - `loadBannerAd()` — pour DocumentListScreen (free only)
- Composant `AdBanner` — banner 320x50 en bas de liste (si !isPro)
- AdMob test IDs pour le développement
- Gestion des cas : pub non chargée → bypass automatique (ne jamais bloquer)

Livrable : pubs affichées en mode test, rewarded complète débloque l'action.

---

### Jour 28–29 — In-App Purchase (Pro) [#17]

**Objectif :** Achat Pro fonctionnel via Google Play Billing.

Produits à configurer dans Google Play Console :
- `facturo_pro_onetime` — achat unique (prix cible: 3,99€)
- `facturo_pro_monthly` — abonnement mensuel (1,49€/mois)

Implémentation :
- `src/services/monetization/iapService.ts`
  - `initIAP()` — connexion au store
  - `getProducts()` — récupère les offres actuelles
  - `purchasePro()` — lance l'achat
  - `restorePurchases()` — restauration (obligatoire sur iOS, best practice Android)
  - `verifyPurchase()` — vérification côté client (Google receipt)
- `usageStore.setPro(true)` après achat vérifié

Livrable : achat test via Google Play sandbox.

---

### Jour 30–31 — UpgradeProScreen [#18]

**Objectif :** Écran de conversion attractif.

Contenu :
- Titre et headline persuasif
- Liste des avantages Pro (sans pub, PDF illimités, logo custom, templates, support)
- Affichage du prix récupéré depuis Google Play (dynamique)
- Bouton principal : "Passer à Pro — {prix}"
- Bouton secondaire : "Abonnement mensuel — {prix}/mois"
- Bouton tertiaire : "Restaurer mes achats"
- Indicateur de quota actuel (X/10 PDFs utilisés ce mois)

Déclenchement :
- Bouton dans SettingsScreen
- Depuis AdGateModal (call-to-action secondaire)
- Automatiquement quand la limite est atteinte (si pas de connexion pub)

---

## Phase 8 — Fonctions Avancées (J32–J35)

### Jour 32–33 — Statistiques [#25]

**Objectif :** Tableau de bord analytique simple.

Métriques :
- Chiffre d'affaires facturé (total) vs encaissé (payé)
- Nombre de devis / factures par statut
- Top 5 clients par CA
- Évolution mensuelle (12 derniers mois) — graphique barres
- Taux de conversion devis → factures

Bibliothèque : `react-native-chart-kit` ou `victory-native`

---

### Jour 34 — Sauvegarde / Restauration [#24]

**Objectif :** Export complet des données en JSON.

Fonctionnalités :
- Export : sérialiser tous les stores → JSON → `expo-sharing`
- Import : sélectionner fichier → valider structure → merge ou remplacer
- Avertissement avant import : "Cette opération remplace vos données actuelles"
- Format fichier : `facturo-backup-{date}.json`

---

### Jour 35 — Notifications locales [#29]

**Objectif :** Rappels pour les échéances de paiement.

Implémentation :
- `expo-notifications`
- Planifier une notification J-3 et J0 pour chaque facture avec date d'échéance
- Re-planifier quand une facture est marquée payée (annuler les notifs)
- Paramètre dans Settings : activer/désactiver les rappels
- Naviguer vers la facture concernée depuis la notification

---

## Phase 9 — Store & CI/CD (J36–J40)

### Jour 36 — GitHub Actions + EAS Build Auto [#22, #23]

**Objectif :** Pipeline CI/CD complet.

Fichier `.github/workflows/eas-build.yml` :
```yaml
Triggers:
  - push sur main → build preview
  - tag v*.*.* → build production
  
Steps:
  1. Setup Node 18
  2. npm ci
  3. eas build --platform android --non-interactive
  4. Notify on success/failure
```

Secrets GitHub à configurer (#23) :
- `EXPO_TOKEN`
- `ADMOB_APP_ID_ANDROID`
- `IAP_PRODUCT_ID_ONETIME`
- `IAP_PRODUCT_ID_MONTHLY`

---

### Jour 37 — Assets Play Store + Icônes [#20]

**Objectif :** App prête visuellement pour le store.

Tâches :
- Icône app 1024x1024 (conforme Play Store guidelines)
- Splash screen
- Feature graphic 1024x500
- 4-8 captures d'écran (2 formats : phone + tablet)
- Rédiger le titre et la description courte/longue Play Store (FR + EN)
- Catégorie : Finance / Business
- `app.json` : version, bundleIdentifier, permissions justifiées

---

### Jour 38 — Politique de Confidentialité [#27]

**Objectif :** Page obligatoire pour Google Play.

Contenu :
- Données collectées : aucune (offline-first)
- Données AdMob : mentionner Google's data practices
- Données IAP : mentionner Google Play
- Contact : email du développeur
- Hébergée sur GitHub Pages ou une URL simple

---

### Jour 39 — README Complet [#28]

**Objectif :** Documentation complète pour les développeurs.

Sections :
- Description et features
- Screenshots
- Getting started (prérequis, install, run)
- Structure du projet
- Architecture decisions
- Monetization model
- Contributing guide
- License

---

### Jour 40 — Checklist QA + Soumission [#30, #21]

**Objectif :** Validation finale avant publication.

Checklist QA :
- [ ] Créer un devis complet avec 3 lignes, remise, TVA → vérifier calculs
- [ ] Convertir le devis en facture → vérifier numérotation et liens
- [ ] Générer un PDF → vérifier rendu avec logo et sans logo
- [ ] Partager PDF via WhatsApp
- [ ] Atteindre la limite de PDFs → vérifier que l'ad-gate s'affiche
- [ ] Regarder la pub 30 sec → vérifier que le PDF se génère
- [ ] Tester l'achat Pro en sandbox → vérifier désactivation des pubs
- [ ] Restaurer un achat
- [ ] Exporter/importer les données (backup)
- [ ] Tester les notifications de rappel
- [ ] Basculer langue FR ↔ EN
- [ ] Tester 5+ devises différentes (EUR, USD, XAF, GBP, JPY)
- [ ] Tester sur Android 8, 10, 13
- [ ] Vérifier les permissions dans app.json (aucune superflue)
- [ ] ProGuard / minification activée en production

Soumission Play Store (#21) :
- `eas build --platform android --profile production`
- Upload AAB dans Google Play Console
- Remplir la fiche complète (description, screenshots, politique confidentialité)
- Tester en Internal Testing (10 testeurs)
- Soumettre pour review Google

---

## Récapitulatif des Issues GitHub

| # | Titre | Phase | Jour | Priorité |
|---|---|---|---|---|
| #1 | Init Expo/TypeScript | 1 | J1 | 🔴 Critique |
| #2 | Dépendances | 1 | J2 | 🔴 Critique |
| #3 | EAS Build Android | 1 | J3 | 🔴 Critique |
| #26 | Thème + Design System | 1 | J3 | 🟠 Haute |
| #4 | Types TypeScript | 2 | J4 | 🔴 Critique |
| #5 | Store Zustand | 2 | J5 | 🔴 Critique |
| #9 | Gestion Clients | 3 | J7–J8 | 🔴 Critique |
| #10 | Gestion Produits | 3 | J9–J10 | 🟠 Haute |
| #11 | Paramètres + Profil | 3 | J11–J13 | 🔴 Critique |
| #7 | Éditeur Documents | 4 | J14–J16 | 🔴 Critique |
| #14 | Conversion Devis→Facture | 4 | J17–J18 | 🔴 Critique |
| #8 | Liste Documents | 5 | J19 | 🔴 Critique |
| #6 | Dashboard | 5 | J20 | 🟠 Haute |
| #19 | Onboarding | 5 | J21 | 🟡 Normale |
| #12 | Générateur PDF | 6 | J22–J24 | 🔴 Critique |
| #13 | Prévisualisation + Partage | 6 | J25 | 🔴 Critique |
| #16 | Ad-Gate (flux PDF) | 6 | J26 | 🔴 Critique |
| #15 | AdMob Rewarded + Banner | 7 | J27 | 🟠 Haute |
| #17 | In-App Purchase Pro | 7 | J28–J29 | 🟠 Haute |
| #18 | Écran Upgrade Pro | 7 | J30–J31 | 🟠 Haute |
| #25 | Statistiques | 8 | J32–J33 | 🟡 Normale |
| #24 | Backup/Restore JSON | 8 | J34 | 🟡 Normale |
| #29 | Notifications rappels | 8 | J35 | 🟡 Normale |
| #22 | GitHub Actions EAS | 9 | J36 | 🟠 Haute |
| #23 | Secrets GitHub | 9 | J36 | 🟠 Haute |
| #20 | Fiche Play Store | 9 | J37 | 🟠 Haute |
| #28 | README complet | 9 | J39 | 🟡 Normale |
| #27 | Politique confidentialité | 9 | J38 | 🟠 Haute |
| #30 | Checklist QA | 9 | J40 | 🔴 Critique |
| #21 | Soumission Play Store | 9 | J40 | 🔴 Critique |

---

## Issues à créer / modifier

Les issues suivantes doivent être **ajoutées ou mises à jour** sur GitHub pour refléter les décisions d'architecture :

### Nouvelles issues à créer
- **[DATA] Implémenter les calculs financiers (utils/calculations.ts)** — tests unitaires inclus
- **[SETUP] Configurer i18n (i18next + expo-localization)** — FR + EN dès le départ
- **[DATA] Implémenter le support multi-devises complet (150+ ISO 4217)**
- **[UI] Écran gestion des taux de TVA (TaxRatesScreen)**
- **[MONETISATION] Implémenter l'Ad-Gate (service + modal)** — remplace le modèle freemium bloquant

### Issues à mettre à jour
- **#16** : Modifier la description — le modèle n'est PAS un blocage. L'utilisateur regarde une pub de 30 secondes pour continuer. Jamais de blocage hard.
- **#15** : Préciser que le banner n'apparaît QUE sur DocumentListScreen (version gratuite), et jamais sur les écrans d'édition ou PDF.

---

## Suivi de progression

Utiliser les **GitHub Projects** (Kanban) avec les colonnes :
- `Backlog` — toutes les issues au départ
- `In Progress` — issue en cours de développement
- `In Review` — PR ouverte, en attente de validation
- `Done` — issue fermée, code fusionné

Labels GitHub utilisés :
- `setup` `data` `ui` `pdf` `monetisation` `store` `ci-cd`
- `priority:critical` `priority:high` `priority:normal`
- `v1` `v2`

---

*Plan établi le 2026-06-11 par Claude Code (architecte du projet).*
*Revoir et ajuster les estimations après chaque phase terminée.*
