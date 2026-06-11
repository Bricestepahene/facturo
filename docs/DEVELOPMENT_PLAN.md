# Facturo — Plan de Développement

**Durée : 42 jours ouvrables | 9 phases | Objectif : Play Store + 3 000 users J+30**  
**Architecte : Claude Code | Dernière révision : 2026-06-11 (v2 — SQLite + @react-pdf)**

---

## Résumé des phases

| Phase | Titre | Jours | Issues |
|---|---|---|---|
| 1 | Setup & Infrastructure | J1–J3 | #1 #2 #3 #26 #31 |
| 2 | Base de données SQLite | J4–J7 | #4 #35 #36 |
| 3 | Utilitaires & Calculs | J8–J9 | #32 #33 |
| 4 | CRUD — Clients, Produits, Paramètres | J10–J16 | #9 #10 #11 #34 |
| 5 | Éditeur de Documents | J17–J21 | #7 #14 |
| 6 | Liste, Dashboard, Onboarding | J22–J24 | #6 #8 #19 |
| 7 | Moteur PDF | J25–J30 | #12 #13 #16 |
| 8 | Monétisation complète | J31–J35 | #15 #17 #18 |
| 9 | Fonctions avancées | J36–J38 | #24 #25 #29 |
| 10 | Store, CI/CD, Lancement | J39–J42 | #20 #21 #22 #23 #27 #28 #30 |

---

## Phase 1 — Setup & Infrastructure (J1–J3)

### Jour 1 — Init Expo + TypeScript + Navigation [#1]

```bash
npx create-expo-app facturo --template expo-template-blank-typescript
```

- `tsconfig.json` : `strict: true`, alias de chemin `@/` → `src/`
- Installer React Navigation v6 : native, bottom-tabs, stack
- `AppNavigator.tsx` : 5 onglets placeholder (Dashboard, Documents, Clients, Produits, Paramètres)
- ESLint + Prettier configurés
- ✅ Vérification : `npx expo start` → app visible, 5 onglets

### Jour 2 — Toutes les dépendances [#2]

```bash
# Base de données
npm install expo-sqlite drizzle-orm
npm install -D drizzle-kit

# UI & Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# Formulaires
npm install react-hook-form @hookform/resolvers zod

# PDF
npm install @react-pdf/renderer

# i18n
npm install i18next react-i18next expo-localization

# Partage & Fichiers
npm install expo-sharing expo-file-system expo-print

# Notifications
npm install expo-notifications

# Monétisation
npm install react-native-google-mobile-ads
npm install expo-in-app-purchases

# Utilitaires
npm install @react-native-community/datetimepicker
npm install react-native-pdf
npm install nanoid
```

- `drizzle.config.ts` : pointé vers `src/db/schema.ts`
- `app.config.js` : config dynamique pour les variables d'environnement
- ✅ Vérification : build Android sans erreur

### Jour 3 — EAS Build + Design System [#3, #26]

**EAS :**
```bash
npm install -g eas-cli && eas login && eas init
```
- `eas.json` : profiles development / preview / production
- Keystore Android généré via EAS

**Design System (`src/theme/`) :**
```typescript
// colors.ts
export const colors = {
  primary:    '#2563EB', // bleu professionnel
  primaryDark:'#1D4ED8',
  secondary:  '#10B981', // vert succès
  error:      '#EF4444',
  warning:    '#F59E0B',
  surface:    '#FFFFFF',
  background: '#F8FAFC',
  textPrimary:'#1E293B',
  textSecondary:'#64748B',
  border:     '#E2E8F0',
  // Statuts documents
  statusDraft:    '#94A3B8',
  statusSent:     '#3B82F6',
  statusPaid:     '#10B981',
  statusOverdue:  '#EF4444',
  statusConverted:'#8B5CF6',
}
```

- `typography.ts` : fontSizes xs(10)/sm(12)/md(14)/lg(16)/xl(18)/2xl(24)/3xl(32)
- `spacing.ts` : multiples de 4 → 4/8/12/16/20/24/32/40/48/64
- Composants de base : `Button`, `Input`, `Card`, `Badge`, `Divider`, `EmptyState`, `LoadingSpinner`
- Icônes : `@expo/vector-icons` Ionicons

✅ `eas build --platform android --profile preview` réussit.

---

## Phase 2 — Base de Données SQLite (J4–J7)

### Jour 4 — Schéma Drizzle [#35 — nouvelle issue]

- Créer `src/db/schema.ts` : tables complètes (voir CLAUDE.md)
  - `clients`, `products`, `tax_rates`, `documents`, `document_items`, `company_settings`, `app_usage`
- Créer `src/db/client.ts` :
  ```typescript
  import { drizzle } from 'drizzle-orm/expo-sqlite';
  import { openDatabaseSync } from 'expo-sqlite';

  const sqlite = openDatabaseSync('facturo.db');
  export const db = drizzle(sqlite, { schema });
  ```
- `src/db/migrations/` : générer la migration initiale via `npx drizzle-kit generate`
- `src/db/client.ts` : `runMigrations()` appelé au démarrage de l'app
- ✅ Vérification : app démarre, DB créée, aucune erreur migration

### Jour 5 — Repository Clients & Produits [#36 — nouvelle issue]

`src/repositories/ClientRepository.ts` :
```typescript
export class ClientRepository {
  async findAll(search?: string): Promise<Client[]>
  async findById(id: string): Promise<Client | null>
  async create(data: NewClient): Promise<Client>
  async update(id: string, data: Partial<NewClient>): Promise<Client>
  async delete(id: string): Promise<void>
  async findWithDocumentCount(): Promise<(Client & { documentCount: number })[]>
}
```

`src/repositories/ProductRepository.ts` — même pattern.

✅ Tests : créer/lire/modifier/supprimer client → persisté entre redémarrages.

### Jour 6 — Repository Documents [#36]

`src/repositories/DocumentRepository.ts` :
```typescript
async findAll(filters: {
  type?: 'quote' | 'invoice';
  status?: DocumentStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<Document[]>

async findWithItems(id: string): Promise<DocumentWithItems | null>
async create(data: CreateDocumentInput): Promise<DocumentWithItems>
async update(id: string, data: UpdateDocumentInput): Promise<DocumentWithItems>
async delete(id: string): Promise<void>

async convertQuoteToInvoice(quoteId: string): Promise<Document>
// → Transaction SQLite : crée la facture + met à jour le devis atomiquement

async duplicate(id: string): Promise<Document>
async getStats(): Promise<{ totalRevenue, paidRevenue, pendingCount, overdueCount }>
```

✅ Test critique : conversion devis→facture en transaction (simuler une interruption → vérifier rollback).

### Jour 7 — Repository Paramètres + Seed Data

`src/repositories/SettingsRepository.ts` :
- `getCompanySettings()` / `updateCompanySettings()` — ligne singleton
- `getTaxRates()` / `createTaxRate()` / `updateTaxRate()` / `deleteTaxRate()`
- `getUsage()` / `incrementPdfCount()` / `checkAndResetMonthly()` / `setPro()`

`src/db/seed.ts` :
- 2 clients, 3 produits, 1 devis, 1 facture avec lignes
- Déclenché au premier lancement si `hasSeenOnboarding === false`
- Données en EUR et XAF pour couvrir les deux contextes

---

## Phase 3 — Utilitaires & Calculs (J8–J9)

### Jour 8 — Moteur de calcul + Devises [#32, #33]

**`src/utils/calculations.ts`** — fonctions pures, testées :
```typescript
export function calculateLineItem(item, taxRates): LineItemTotals
export function calculateDocument(items, globalDiscount, taxRates): DocumentTotals
// Résultat : { subtotal, discountAmount, taxableAmount, taxLines, taxTotal, total }
```

**`src/utils/currency.ts`** :
```typescript
export const CURRENCIES: Record<string, CurrencyConfig> = {
  EUR: { code:'EUR', name:'Euro', symbol:'€', symbolPosition:'after',
         decimalDigits:2, thousandsSep:'.', decimalSep:',' },
  USD: { code:'USD', name:'US Dollar', symbol:'$', symbolPosition:'before',
         decimalDigits:2, thousandsSep:',', decimalSep:'.' },
  XAF: { code:'XAF', name:'Franc CFA BEAC', symbol:'FCFA', symbolPosition:'after',
         decimalDigits:0, thousandsSep:' ', decimalSep:',' },
  // ... 150+ devises ISO 4217
};

export function formatCurrency(amount: number, config: CurrencyConfig): string
export function getCurrencyConfig(code: string): CurrencyConfig
export function searchCurrencies(query: string): CurrencyConfig[]
```

**`src/utils/documentNumber.ts`** :
```typescript
export function generateDocumentNumber(prefix: string, year: number, counter: number): string
// → 'FAC-2026-001'
```

**Tests (Jest) :**
- TVA 20% sur 1000 → sous-total 1000, TVA 200, total 1200
- Remise 10% puis TVA 20% → base 900, TVA 180, total 1080
- Remise fixe 50€ + TVA 19.25% → calcul exact
- formatCurrency(1500000, XAF) → '1 500 000 FCFA'
- formatCurrency(1234.56, EUR) → '1.234,56 €'

### Jour 9 — i18n [#31]

`src/i18n/index.ts` :
```typescript
i18n.use(initReactI18next).init({
  lng: Localization.locale.split('-')[0],
  fallbackLng: 'en',
  resources: { fr: { ...frTranslations }, en: { ...enTranslations } },
  interpolation: { escapeValue: false },
});
```

Structure des fichiers `en.json` / `fr.json` — remplir tous les namespaces :
- `common`, `document`, `client`, `product`, `settings`
- `pdf` (labels PDF uniquement — utilisés dans le template)
- `monetization` (ad-gate, upgrade)
- `onboarding`

Règle : une clé manquante en développement = warning visible en console. Configurer `missingKeyHandler`.

---

## Phase 4 — CRUD Screens (J10–J16)

### Jours 10–11 — ClientListScreen + ClientFormScreen [#9]

**ClientListScreen :**
- `FlatList` des clients via `ClientRepository.findAll(search)`
- Barre de recherche (debounce 300ms)
- `ClientCard` : nom, email, pays, nombre de documents
- Swipe gauche : Supprimer (avec confirmation)
- Swipe droite : Modifier
- FAB "+" → ClientFormScreen (création)
- État vide : `EmptyState` avec illustration et CTA

**ClientFormScreen :**
```
Formulaire react-hook-form + Zod :
  - Type (individuel / entreprise) — toggle
  - Nom * (requis)
  - Email (format email)
  - Téléphone
  - Adresse (ligne 1, ligne 2, ville, code postal)
  - Pays (CountryPicker — ISO 3166, avec recherche)
  - N° fiscal (NIF, NIU, TVA — label selon pays)
  - N° d'immatriculation (RCCM, SIRET — label selon pays)
  - Devise préférée (CurrencySelector)
  - Notes
```

Composant `CountryPicker` : FlatList de pays triés + recherche.

### Jours 12–13 — ProductListScreen + ProductFormScreen [#10]

**ProductListScreen :** même pattern que clients.

**ProductFormScreen :**
```
  - Nom * (requis)
  - Description
  - Prix unitaire * (requis, numérique)
  - Unité (UnitPicker) :
    Durée : h, jour, semaine, mois, forfait
    Quantité : pcs, kg, g, L, m, m², m³, km
    Saisie libre possible
  - Catégorie (optionnel)
```

### Jours 14–16 — CompanyProfileScreen + SettingsScreen + TaxRatesScreen [#11, #34]

**SettingsScreen** (menu) :
- Profil entreprise → CompanyProfileScreen
- Taux de TVA → TaxRatesScreen
- Devise par défaut → CurrencySelector inline
- Langue de l'app → FR / EN toggle
- Sauvegarde / Restauration → BackupScreen
- Passer à Pro → UpgradeProScreen
- À propos, Politique de confidentialité

**CompanyProfileScreen :**
- Logo (image picker galerie + base64 pour le PDF)
- Tous les champs company_settings
- `CurrencySelector` — `FlatList` de 150+ devises avec recherche (code + nom)
- Numérotation : préfixe facture/devis + compteur de départ

**TaxRatesScreen :**
- Liste des taux avec taux %, badge "Défaut"
- FAB "+" → modal `TaxRateForm` (nom libre, taux 0–100, défaut oui/non)
- Swipe pour supprimer
- Au premier lancement, pré-remplir selon devise par défaut :
  - EUR → TVA 20%, TVA 10%, TVA 5.5%
  - XAF → TVA 19.25%, AIR 5%
  - Autres → vide

---

## Phase 5 — Éditeur de Documents (J17–J21)

### Jours 17–19 — DocumentEditorScreen [#7]

**En-tête du formulaire :**
- Toggle Devis / Facture
- Numéro (auto-généré, éditable)
- Date + Date d'échéance (DatePicker)
- Devise du document (CurrencySelector)
- Langue du PDF (FR / EN)

**Section Client :**
- `ClientPicker` : modal avec recherche + "Créer rapidement" inline
  - "Créer rapidement" : nom + email → crée en DB + sélectionne
- Affiche le snapshot client sélectionné (modifiable après coup)

**Lignes de document :**
- `FlatList` de `LineItemRow`
- Chaque ligne :
  - Description (autocomplete depuis produits)
  - Quantité + Unité
  - Prix unitaire
  - Remise par ligne (toggle % / fixe)
  - Taux de TVA (multi-select via TaxRateSelector)
  - Total ligne (calculé en temps réel)
  - Bouton supprimer (swipe ou icône)
- "Ajouter une ligne" → menu : "Depuis le catalogue" | "Ligne libre"
- Réorganisation par drag & drop (react-native-draggable-flatlist)

**Résumé financier (en temps réel) :**
```
Sous-total HT       : X,XX €
Remise globale (%) : -X,XX €
─────────────────────────────
Base imposable      : X,XX €
TVA 20%             : X,XX €
TVA 5.5%            : X,XX €
─────────────────────────────
TOTAL TTC           : X,XX €  ← grande, gras
```

**Pied de formulaire :**
- Notes libres
- Conditions de paiement

**Auto-save :** toutes les 10 secondes en `status='draft'`.

**Barre d'actions :**
- [Aperçu PDF] [Enregistrer] [Envoyer] (menu contextuel)

### Jours 20–21 — Conversion Devis → Facture + Duplication [#14]

**Conversion :**
- Bouton accessible depuis le menu "•••" sur un devis (status ≠ 'converted')
- Modal de confirmation avec résumé
- `DocumentRepository.convertQuoteToInvoice(id)` — transaction atomique
- Navigation vers la nouvelle facture
- Indicateur sur le devis : badge violet "Converti → FAC-2026-001"

**Duplication :**
- Accessible depuis menu "•••" sur tout document
- `DocumentRepository.duplicate(id)` — nouvelle série, date = aujourd'hui, status = draft

---

## Phase 6 — Liste, Dashboard, Onboarding (J22–J24)

### Jour 22 — DocumentListScreen [#8]

- Onglets : Tous / Devis / Factures (Bottom Tab intérieur)
- Filtres : statut (chips), plage de dates, client (picker)
- Recherche par numéro ou nom client
- `DocumentCard` : numéro | client | montant formaté | statut (color-coded) | date
- Swipe droite : Partager PDF
- Swipe gauche : Dupliquer | Supprimer
- FAB "+" → Nouveau document (bottom sheet : Devis ou Facture)
- Pagination : 20 résultats par page, load more au scroll

### Jour 23 — DashboardScreen [#6]

Widgets (données réelles via `DocumentRepository.getStats()`) :
- Carte bleue : CA facturé ce mois (total)
- Carte verte : CA encaissé ce mois (statut paid)
- Carte rouge : Factures en retard (count + montant)
- Carte orange : Devis en attente de réponse
- 5 derniers documents avec statut
- Boutons rapides : [+ Nouveau devis] [+ Nouvelle facture]

### Jour 24 — OnboardingScreen [#19]

- 3 slides (Swiper animé) :
  1. "Créez des factures professionnelles en 2 minutes"
  2. "Partagez vos PDFs via WhatsApp, Gmail, n'importe où"
  3. "Vos données restent sur votre téléphone — 100% privé"
- Slide 4 (setup) :
  - Nom de l'entreprise *
  - Devise par défaut (CurrencySelector)
  - Langue (FR / EN)
  - [Commencer] → seed data → Dashboard
- Bouton "Passer" disponible dès slide 1

---

## Phase 7 — Moteur PDF (J25–J30)

### Jours 25–27 — Template PDF @react-pdf/renderer [#12]

**`src/services/pdf/PdfTemplate.tsx`** — composants JSX → PDF :

```
Page A4 :
┌─────────────────────────────────────────┐
│ [Logo]  Nom entreprise                  │
│         Adresse | Tél | Email           │
│                          FACTURE        │
│                          N° FAC-2026-001│
│                          Date: 11/06/26 │
│                          Échéance: ...  │
├─────────────────────────────────────────┤
│ FACTURÉ À :                             │
│ Nom client                              │
│ Adresse, Pays                           │
│ N° fiscal                               │
├─────────────────────────────────────────┤
│ Description | Qté | U | P.U. | % | HT  │
│ ─────────────────────────────────────── │
│ Ligne 1 ...                             │
│ Ligne 2 ...                             │
├─────────────────────────────────────────┤
│                    Sous-total HT : xxx  │
│                    Remise -10% : -xxx   │
│                    Base HT : xxx        │
│                    TVA 20% : xxx        │
│                    TOTAL TTC : xxx      │
├─────────────────────────────────────────┤
│ Notes / Conditions                      │
├─────────────────────────────────────────┤
│ Mentions légales | RIB                  │
│ RCCM, NIU, N° fiscal (si renseignés)   │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│ [version gratuite] Créé avec Facturo   │ ← viral footer
└─────────────────────────────────────────┘
```

- Filigrane diagonal "BROUILLON" / "DRAFT" si status = draft
- Labels PDF en FR ou EN selon `document.language`
- Formatage monétaire selon `document.currency*` — 0 décimale pour XAF, 2 pour EUR
- Logo en base64 (stocké en DB dans `companySettings.logoUri`)

**Test obligatoire** sur device Android réel : vérifier rendu avec/sans logo, avec/sans filigrane.

### Jour 28 — PDFPreviewScreen + Partage [#13]

- `PDFPreviewScreen` : rendu `react-native-pdf` ou WebView
- Bouton Partager → `expo-sharing` → WhatsApp / Gmail / Telegram...
- Bouton Télécharger → `expo-file-system` → dossier Documents
- Bouton Imprimer → `expo-print.printAsync`
- Bouton ← → retour à l'édition

### Jours 29–30 — Intégration Ad-Gate dans le flux PDF [#16]

**`src/services/monetization/AdGate.ts`** :
```typescript
export async function requestPdfGeneration(
  onGenerate: () => Promise<void>
): Promise<void> {
  const usage = await SettingsRepository.getUsage();

  if (usage.isPro || usage.pdfCountThisMonth < FREE_PDF_LIMIT) {
    await onGenerate();
    await SettingsRepository.incrementPdfCount();
    return;
  }

  // Afficher AdGateModal
  showAdGateModal({
    currentCount: usage.pdfCountThisMonth,
    limit: FREE_PDF_LIMIT,
    onWatchAd: async () => {
      const success = await AdService.showRewardedAd();
      // success = false si pub non disponible → bypass quand même
      await onGenerate();
      await SettingsRepository.incrementPdfCount();
    },
    onUpgrade: () => navigate('UpgradePro'),
  });
}
```

**`AdGateModal`** :
- Compteur visible : "7/10 PDFs utilisés ce mois"
- Bouton principal : "Regarder une pub (30 sec)" — primaire, visuellement dominant
- Bouton secondaire : "Passer à Pro — voir les avantages"
- Si aucune pub disponible → afficher "Générer quand même" (bypass gracieux)

---

## Phase 8 — Monétisation (J31–J35)

### Jour 31 — AdMob (Rewarded + Banner) [#15]

**`src/services/monetization/AdService.ts`** :
- Initialiser AdMob au démarrage
- `loadRewardedAd()` — précharger dès l'ouverture de l'app (pas quand on en a besoin)
- `showRewardedAd()` → Promise\<boolean> (true = regardé, false = échec/skip)
- Composant `AdBanner` : banner 320×50 en bas de `DocumentListScreen` seulement
  - `{!isPro && <AdBanner />}`

IDs de test en développement :
```
Rewarded : ca-app-pub-3940256099942544/5224354917
Banner :   ca-app-pub-3940256099942544/6300978111
```

### Jours 32–33 — In-App Purchase [#17]

Produits Google Play Console :
- `facturo_pro_onetime` : achat unique (3,99€ — à tester avec tarif local)
- `facturo_pro_monthly` : abonnement 1,49€/mois

**`src/services/monetization/IapService.ts`** :
- `initIAP()` — connexion store au démarrage
- `getProducts()` — récupère prix actuels depuis Play Store
- `purchasePro(productId)` — lance l'achat natif
- `verifyAndActivate(purchase)` — vérifie receipt + `SettingsRepository.setPro(true)`
- `restorePurchases()` — obligatoire Android

### Jours 34–35 — UpgradeProScreen [#18]

Avantages Pro affichés :
- ✅ PDFs illimités sans publicité
- ✅ Suppression du branding "Créé avec Facturo" dans les PDFs
- ✅ Toutes les fonctionnalités futures Pro en priorité
- ✅ Support prioritaire

Layout :
- Prix récupérés dynamiquement depuis Google Play (pas en dur)
- Bouton "Achat unique — X,XX€" (dominant)
- Bouton "Abonnement — X,XX€/mois"
- Lien "Restaurer mes achats"
- Mention : "Aucun compte requis. Paiement sécurisé via Google Play."

Déclenchement :
- Menu Paramètres
- Bouton secondaire dans AdGateModal
- Badge "Passer à Pro" sur DashboardScreen (subtil, non intrusif)

---

## Phase 9 — Fonctions Avancées (J36–J38)

### Jour 36 — Statistiques [#25]

Métriques depuis `DocumentRepository.getStats()` :
- CA facturé vs encaissé (barres par mois, 6 derniers mois)
- Répartition statuts (camembert)
- Top 5 clients par CA
- Taux conversion devis → factures

Bibliothèque : `victory-native` (légère, compatible Expo)

### Jour 37 — Sauvegarde / Restauration [#24]

**Export :**
```typescript
const backup = {
  version: '1.0',
  exportedAt: new Date().toISOString(),
  data: { clients, products, documents, documentItems, taxRates, companySettings }
};
// → JSON → expo-sharing → "facturo-backup-2026-06-11.json"
```

**Import :**
- `expo-document-picker` → sélectionner le fichier `.json`
- Valider le format (version, présence des tables)
- Modal de confirmation : "Ceci remplacera toutes vos données actuelles"
- Restaurer en transaction SQLite (effacer + réinsérer)

### Jour 38 — Notifications de Rappel [#29]

- `expo-notifications` : permissions au premier lancement
- Paramètre Settings : "Rappels d'échéances" (activé par défaut)
- Planification : J-3 et J-0 pour chaque facture avec `dueDate` et status ≠ 'paid'
- Annulation : quand une facture passe en `status='paid'`
- Deep link : ouvre la facture concernée depuis la notification

---

## Phase 10 — Store, CI/CD, Lancement (J39–J42)

### Jour 39 — GitHub Actions + EAS Build [#22, #23]

`.github/workflows/eas-build.yml` déjà en place — vérifier et tester :
- Push sur `main` → build preview
- Tag `v*.*.*` → build production
- Secrets GitHub configurés (#23) : `EXPO_TOKEN`, `ADMOB_APP_ID_ANDROID`, `IAP_PRODUCT_ID_*`

### Jour 40 — Assets Play Store + README [#20, #28]

**Assets :**
- Icône app 1024×1024 (fond bleu, lettre F)
- Splash screen
- Feature graphic 1024×500
- 6 screenshots phone + 2 tablet
- Vidéo de démo 30 secondes (screen recording + voix off)

**ASO (App Store Optimization) :**
- Titre : "Facturo – Factures & Devis PDF"
- Sous-titre : "Freelances, TPE, auto-entrepreneurs"
- Description courte (80 chars) : "Créez des factures PDF en 2 minutes, partagez-les via WhatsApp"
- Description longue : inclure les mots-clés facture / devis / invoice / PDF / TVA / freelance

**README.md :** finaliser avec screenshots réels.

### Jour 41 — Politique de Confidentialité [#27]

URL publique hébergée sur GitHub Pages (`/docs/privacy-policy.html`) :

Contenu obligatoire :
- Aucune donnée transmise à nos serveurs (offline-first)
- Données AdMob : lien vers politique Google
- Données IAP : gérées par Google Play
- Données stockées localement sur l'appareil
- Contact : email du développeur

### Jour 42 — QA Final + Soumission Play Store [#30, #21]

**Checklist QA (tous les cas) :**

Fonctionnel :
- [ ] Créer devis avec 3 lignes, remise 10%, TVA 19.25% → vérifier calculs exacts
- [ ] Convertir devis → facture → vérifier numéros, liens, snapshot préservé
- [ ] Tenter de convertir un devis déjà converti → bouton désactivé
- [ ] Dupliquer une facture → vérifier nouveau numéro, date, statut draft
- [ ] Supprimer un client avec des factures → factures orphelines (clientSnapshot préservé)
- [ ] Modifier taux TVA → anciens documents non affectés
- [ ] Tester 5 devises (EUR, USD, XAF, JPY, GBP) → formatage correct dans PDF

Monétisation :
- [ ] Générer 10 PDFs → le 11ème affiche AdGateModal
- [ ] Regarder pub 30 sec → PDF généré
- [ ] Simuler pub non disponible → bypass automatique, PDF généré
- [ ] Bouton "Passer à Pro" → UpgradeProScreen
- [ ] Achat Pro en sandbox → plus d'AdGate, pied de page supprimé
- [ ] Restaurer achat → Pro réactivé

Data :
- [ ] Exporter backup → fichier JSON valide
- [ ] Importer backup → données restaurées intégralement
- [ ] Désinstaller / réinstaller → données perdues (comportement attendu sans cloud)

PDF :
- [ ] PDF avec logo d'entreprise
- [ ] PDF sans logo
- [ ] PDF avec filigrane BROUILLON
- [ ] PDF en français et en anglais
- [ ] Partager via WhatsApp → fichier reçu lisible
- [ ] Imprimer → mise en page A4 correcte

Devices :
- [ ] Android 8.0 (API 26)
- [ ] Android 10.0 (API 29)
- [ ] Android 13.0 (API 33)
- [ ] Petit écran (5") et grand écran (6.7")

**Soumission :**
```bash
eas build --platform android --profile production
```
- Upload AAB dans Google Play Console
- Internal Testing : 10 testeurs minimum
- 3 jours de test interne → soumettre review Google

---

## Issues à créer (non encore ouvertes)

| # | Titre | Phase | Priorité |
|---|---|---|---|
| #35 | [DB] Créer le schéma Drizzle + migration initiale | 2 | 🔴 Critical |
| #36 | [DB] Implémenter les Repositories (pattern accès données) | 2 | 🔴 Critical |

---

## Récapitulatif — 34 Issues actives + 2 nouvelles

| Priorité | Issues |
|---|---|
| 🔴 Critical (17) | #1 #2 #3 #4 #7 #8 #9 #12 #13 #14 #16 #21 #30 #33 #35 #36 + conversion |
| 🟠 High (12) | #6 #10 #11 #15 #17 #18 #20 #22 #23 #26 #27 #31 #32 #34 |
| 🟡 Normal (5) | #19 #24 #25 #28 #29 |

---

*Plan v2 — Révisé le 2026-06-11*  
*Changements v2 vs v1 : AsyncStorage → SQLite/Drizzle, expo-print → @react-pdf/renderer, ajout pattern Repository, stratégie de croissance explicite*
