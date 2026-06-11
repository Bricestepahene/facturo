# Facturo — Claude Code Instructions

> **Ce fichier est la bible du projet. Lire intégralement avant toute modification.**

---

## Vision & Objectifs

**Facturo** est une application mobile de facturation professionnelle, mondiale, hors-ligne.

**Cible :** Freelances, consultants, TPE/PME — partout dans le monde.  
**Différenciation :** Aucun compte requis, fonctionne 100% hors-ligne, PDFs professionnels, jamais de blocage.  
**Objectif de lancement :** 3 000 utilisateurs actifs dans le premier mois post-publication Play Store.

**Levier de croissance principal :** Chaque PDF partagé est un vecteur d'acquisition. Le pied de page des PDFs gratuits inclut "Créé avec Facturo" — chaque facture envoyée via WhatsApp/Gmail est une publicité gratuite.

---

## Stack Technique

```
Framework :      Expo SDK 51+ (React Native), TypeScript strict
Base de données: expo-sqlite + drizzle-orm (SQLite local, sur l'appareil)
Migrations DB :  drizzle-kit (fichiers de migration versionnés)
État UI :        Zustand (état temporaire UI uniquement — pas de persistance)
Navigation :     React Navigation v6 (Bottom Tabs + Stack + Modal)
Formulaires :    react-hook-form + Zod
PDF :            @react-pdf/renderer (rendu JS pur, qualité professionnelle)
i18n :           i18next + react-i18next + expo-localization
Partage PDF :    expo-sharing + expo-file-system
Publicités :     react-native-google-mobile-ads (AdMob + Mediation)
Achats :         expo-in-app-purchases (Google Play Billing)
Notifications :  expo-notifications
Build :          EAS Build (Expo Application Services)
CI/CD :          GitHub Actions → EAS
Lint/Format :    ESLint + Prettier
Tests :          Jest + @testing-library/react-native
```

---

## Architecture — Vue d'ensemble

```
┌─────────────────────────────────────────┐
│              SCREENS (UI)               │
│    react-hook-form + Zod validation     │
├─────────────────────────────────────────┤
│           ZUSTAND STORES (UI)           │
│   État temporaire : filtres, sélection  │
│   Pas de persistance dans Zustand       │
├─────────────────────────────────────────┤
│         REPOSITORIES (Services)         │
│  ClientRepository, DocumentRepository  │
│  Couche d'abstraction entre UI et DB    │
├─────────────────────────────────────────┤
│      DRIZZLE ORM (Requêtes SQL)         │
│   Type-safe, migrations versionnées     │
├─────────────────────────────────────────┤
│        SQLITE (expo-sqlite)             │
│   Base de données locale sur l'appareil │
│   Données persistantes, jamais perdues  │
└─────────────────────────────────────────┘
```

**Règle fondamentale :** Toute donnée métier passe par SQLite via les Repositories.  
Zustand ne gère que l'état de navigation et les filtres temporaires d'écran.

---

## Structure du Projet

```
facturo/
├── src/
│   ├── db/
│   │   ├── schema.ts           # Schéma Drizzle (tables + types inférés)
│   │   ├── migrations/         # Fichiers SQL générés par drizzle-kit
│   │   ├── client.ts           # Initialisation de la connexion SQLite
│   │   └── seed.ts             # Données de démo pour le premier lancement
│   │
│   ├── repositories/           # Couche d'accès aux données
│   │   ├── ClientRepository.ts
│   │   ├── ProductRepository.ts
│   │   ├── DocumentRepository.ts
│   │   ├── TaxRateRepository.ts
│   │   └── SettingsRepository.ts
│   │
│   ├── services/
│   │   ├── pdf/
│   │   │   ├── PdfTemplate.tsx     # Composants @react-pdf/renderer
│   │   │   ├── PdfGenerator.ts     # generatePdf(document, company) → URI
│   │   │   └── PdfSharing.ts       # share / download / print
│   │   ├── monetization/
│   │   │   ├── AdService.ts        # AdMob rewarded + banner
│   │   │   ├── IapService.ts       # In-app purchases
│   │   │   └── AdGate.ts           # Logique ad-gate (jamais de blocage)
│   │   └── backup/
│   │       └── BackupService.ts    # Export/import JSON
│   │
│   ├── stores/                 # Zustand — état UI uniquement
│   │   ├── documentUiStore.ts  # Filtres, tri, onglet actif
│   │   ├── usageStore.ts       # Compteur PDF/mois + isPro
│   │   └── onboardingStore.ts  # hasSeenOnboarding
│   │
│   ├── screens/
│   │   ├── dashboard/          DashboardScreen.tsx
│   │   ├── documents/          DocumentListScreen.tsx, DocumentEditorScreen.tsx
│   │   ├── preview/            PdfPreviewScreen.tsx
│   │   ├── clients/            ClientListScreen.tsx, ClientFormScreen.tsx
│   │   ├── products/           ProductListScreen.tsx, ProductFormScreen.tsx
│   │   ├── settings/           SettingsScreen.tsx, CompanyProfileScreen.tsx
│   │   │                       TaxRatesScreen.tsx, BackupScreen.tsx
│   │   ├── onboarding/         OnboardingScreen.tsx
│   │   └── upgrade/            UpgradeProScreen.tsx
│   │
│   ├── components/
│   │   ├── common/             Button, Input, Card, Badge, Modal, EmptyState...
│   │   ├── forms/              LineItemRow, ClientPicker, TaxSelector...
│   │   └── ads/                AdBanner.tsx
│   │
│   ├── utils/
│   │   ├── calculations.ts     # Calculs financiers purs (testés)
│   │   ├── currency.ts         # Formatage + liste 150+ devises ISO 4217
│   │   ├── documentNumber.ts   # Génération numéros FAC/DEV
│   │   └── dateUtils.ts
│   │
│   ├── i18n/
│   │   ├── en.json
│   │   ├── fr.json
│   │   └── index.ts
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   │
│   └── navigation/
│       └── AppNavigator.tsx
│
├── drizzle.config.ts           # Config drizzle-kit
├── app.config.js               # Config Expo dynamique (env vars)
├── eas.json
├── docs/
│   ├── DEVELOPMENT_PLAN.md
│   └── ARCHITECTURE.md
└── .github/workflows/eas-build.yml
```

---

## Schéma de Base de Données (Drizzle)

```typescript
// src/db/schema.ts

import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const clients = sqliteTable('clients', {
  id:                   text('id').primaryKey(),
  type:                 text('type', { enum: ['individual', 'company'] }).notNull(),
  name:                 text('name').notNull(),
  email:                text('email'),
  phone:                text('phone'),
  addressLine1:         text('address_line1'),
  addressLine2:         text('address_line2'),
  city:                 text('city'),
  state:                text('state'),
  postalCode:           text('postal_code'),
  countryCode:          text('country_code').notNull().default('FR'),
  taxId:                text('tax_id'),
  registrationNumber:   text('registration_number'),
  defaultCurrencyCode:  text('default_currency_code'),
  notes:                text('notes'),
  createdAt:            text('created_at').notNull(),
  updatedAt:            text('updated_at').notNull(),
});

export const products = sqliteTable('products', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  description: text('description'),
  unitPrice:   real('unit_price').notNull().default(0),
  unit:        text('unit').notNull().default('pcs'),
  category:    text('category'),
  createdAt:   text('created_at').notNull(),
  updatedAt:   text('updated_at').notNull(),
});

export const taxRates = sqliteTable('tax_rates', {
  id:         text('id').primaryKey(),
  name:       text('name').notNull(),
  rate:       real('rate').notNull(),
  isDefault:  integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isCompound: integer('is_compound', { mode: 'boolean' }).notNull().default(false),
  createdAt:  text('created_at').notNull(),
});

export const documents = sqliteTable('documents', {
  id:     text('id').primaryKey(),
  type:   text('type', { enum: ['quote', 'invoice'] }).notNull(),
  status: text('status', {
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'converted']
  }).notNull().default('draft'),

  number:   text('number').notNull(),
  date:     text('date').notNull(),
  dueDate:  text('due_date'),
  language: text('language', { enum: ['fr', 'en'] }).notNull().default('fr'),

  // Devise — snapshot complet pour que le PDF reste exact même si l'utilisateur
  // change de devise par défaut plus tard
  currencyCode:           text('currency_code').notNull(),
  currencySymbol:         text('currency_symbol').notNull(),
  currencySymbolPosition: text('currency_symbol_position').notNull().default('before'),
  currencyDecimalDigits:  integer('currency_decimal_digits').notNull().default(2),
  currencyThousandsSep:   text('currency_thousands_sep').notNull().default(','),
  currencyDecimalSep:     text('currency_decimal_sep').notNull().default('.'),

  // Client — snapshot JSON pour que la facture reste valide même si le client
  // est modifié ou supprimé ultérieurement
  clientId:       text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  clientSnapshot: text('client_snapshot').notNull(), // JSON stringify(Client)

  // Remise globale
  globalDiscountType:  text('global_discount_type', { enum: ['percentage', 'fixed'] }),
  globalDiscountValue: real('global_discount_value'),

  // Totaux calculés et stockés (jamais recalculés à la volée — source de vérité)
  subtotal:      real('subtotal').notNull().default(0),
  discountAmount:real('discount_amount').notNull().default(0),
  taxableAmount: real('taxable_amount').notNull().default(0),
  taxTotal:      real('tax_total').notNull().default(0),
  total:         real('total').notNull().default(0),

  notes: text('notes'),
  terms: text('terms'),

  // Liens de conversion
  convertedFromId: text('converted_from_id').references((): any => documents.id),
  convertedToId:   text('converted_to_id').references((): any => documents.id),

  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const documentItems = sqliteTable('document_items', {
  id:         text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  position:   integer('position').notNull(),
  productId:  text('product_id'),

  description: text('description').notNull(),
  quantity:    real('quantity').notNull().default(1),
  unitPrice:   real('unit_price').notNull().default(0),
  unit:        text('unit').notNull().default('pcs'),

  discountType:  text('discount_type', { enum: ['percentage', 'fixed'] }),
  discountValue: real('discount_value'),

  // JSON array des IDs de taux de TVA appliqués à cette ligne
  appliedTaxRateIds: text('applied_tax_rate_ids').notNull().default('[]'),

  // Totaux par ligne
  subtotal:      real('subtotal').notNull().default(0),
  discountAmount:real('discount_amount').notNull().default(0),
  taxableAmount: real('taxable_amount').notNull().default(0),
  taxAmount:     real('tax_amount').notNull().default(0),
  total:         real('total').notNull().default(0),
});

export const companySettings = sqliteTable('company_settings', {
  id:                    text('id').primaryKey().default('singleton'),
  name:                  text('name').notNull().default(''),
  logoUri:               text('logo_uri'),
  addressLine1:          text('address_line1'),
  addressLine2:          text('address_line2'),
  city:                  text('city'),
  state:                 text('state'),
  postalCode:            text('postal_code'),
  countryCode:           text('country_code').default('FR'),
  phone:                 text('phone'),
  email:                 text('email'),
  website:               text('website'),
  taxId:                 text('tax_id'),
  registrationNumber:    text('registration_number'),
  defaultCurrencyCode:   text('default_currency_code').notNull().default('EUR'),
  defaultLanguage:       text('default_language').notNull().default('fr'),
  invoicePrefix:         text('invoice_prefix').notNull().default('FAC'),
  invoiceCounter:        integer('invoice_counter').notNull().default(0),
  quotePrefix:           text('quote_prefix').notNull().default('DEV'),
  quoteCounter:          integer('quote_counter').notNull().default(0),
  defaultPaymentTermsDays: integer('default_payment_terms_days').notNull().default(30),
  legalMentions:         text('legal_mentions'),
  bankDetails:           text('bank_details'),
});

export const appUsage = sqliteTable('app_usage', {
  id:               text('id').primaryKey().default('singleton'),
  pdfCountThisMonth:integer('pdf_count_this_month').notNull().default(0),
  lastResetMonth:   text('last_reset_month').notNull().default(''), // 'YYYY-MM'
  isPro:            integer('is_pro', { mode: 'boolean' }).notNull().default(false),
  hasSeenOnboarding:integer('has_seen_onboarding', { mode: 'boolean' }).notNull().default(false),
  proReceiptToken:  text('pro_receipt_token'), // Google Play receipt pour vérification
});
```

---

## Pattern Repository

Chaque repository encapsule toutes les requêtes SQLite pour un domaine.  
Les screens n'appellent jamais Drizzle directement — toujours via un repository.

```typescript
// src/repositories/DocumentRepository.ts (exemple)

export class DocumentRepository {
  async findAll(filters?: DocumentFilters): Promise<Document[]>
  async findById(id: string): Promise<Document | null>
  async findWithItems(id: string): Promise<DocumentWithItems | null>
  async create(data: CreateDocumentInput): Promise<Document>
  async update(id: string, data: UpdateDocumentInput): Promise<Document>
  async delete(id: string): Promise<void>
  async convertQuoteToInvoice(quoteId: string): Promise<Document>
  async duplicate(id: string): Promise<Document>
  async getStats(): Promise<DocumentStats>
}
```

---

## Génération PDF — @react-pdf/renderer

Le PDF est rendu côté JavaScript pur — résultat identique sur tous les appareils Android.

```typescript
// src/services/pdf/PdfTemplate.tsx
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

export function InvoicePdf({ document, company, t }: PdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header company={company} document={document} />
        <ClientBlock client={document.clientSnapshot} t={t} />
        <ItemsTable items={document.items} currency={document.currency} t={t} />
        <FinancialSummary document={document} t={t} />
        <Footer company={company} document={document} isPro={isPro} t={t} />
        {document.status === 'draft' && <DraftWatermark t={t} />}
      </Page>
    </Document>
  );
}
```

### Pied de page PDF — Levier de croissance

```typescript
// Version GRATUITE
function Footer({ isPro, ... }) {
  return (
    <View style={styles.footer}>
      <Text>{company.legalMentions}</Text>
      <Text>{company.bankDetails}</Text>
      {!isPro && (
        <Text style={styles.brandingFooter}>
          Créé avec Facturo — facturo.app
        </Text>
      )}
    </View>
  );
}
```

**Ce pied de page est le principal moteur de croissance.** Chaque PDF partagé est une publicité gratuite. Retirer ce branding est l'un des avantages Pro les plus convaincants.

---

## Modèles Métier (Types TypeScript)

Les types sont **inférés automatiquement depuis le schéma Drizzle** avec `InferSelectModel` et `InferInsertModel`. Ne pas les redéfinir manuellement.

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from '@/db/schema';

export type Client         = InferSelectModel<typeof schema.clients>;
export type NewClient      = InferInsertModel<typeof schema.clients>;
export type Product        = InferSelectModel<typeof schema.products>;
export type Document       = InferSelectModel<typeof schema.documents>;
export type DocumentItem   = InferSelectModel<typeof schema.documentItems>;
export type TaxRate        = InferSelectModel<typeof schema.taxRates>;
export type CompanySettings= InferSelectModel<typeof schema.companySettings>;
```

Types composites (non stockés, calculés) :
```typescript
export type DocumentWithItems = Document & { items: DocumentItem[] };
export type CurrencyConfig = {
  code: string; symbol: string; symbolPosition: 'before' | 'after';
  decimalDigits: number; thousandsSep: string; decimalSep: string;
};
```

---

## Règles de Calcul Financier

**Règle absolue : arrondir uniquement à l'affichage. Jamais dans les calculs intermédiaires.**

```
Par ligne :
  itemSubtotal    = quantity × unitPrice
  itemDiscount    = (type='%') ? itemSubtotal × (val/100) : val
  itemTaxable     = itemSubtotal - itemDiscount
  itemTaxAmount   = Σ(rate/100 × itemTaxable) pour chaque taux appliqué
  itemTotal       = itemTaxable + itemTaxAmount

Document :
  docSubtotal     = Σ(item.itemSubtotal)
  docDiscount     = (type='%') ? docSubtotal × (val/100) : val
  docTaxable      = docSubtotal - docDiscount
  taxLines        = regrouper items par taxRateId, sommer bases et montants
  docTaxTotal     = Σ(taxLine.amount)
  docTotal        = docTaxable + docTaxTotal
```

Les totaux sont calculés puis **stockés en base** à chaque sauvegarde. Un document ne recalcule jamais ses totaux après génération du PDF — le montant visible dans la liste est exact même si les taux changent plus tard.

---

## Règles Métier — Conversion Devis → Facture

1. Confirmation utilisateur obligatoire (modal)
2. Créer une nouvelle ligne `documents` :
   - Copier : `clientId`, `clientSnapshot`, `currency*`, `globalDiscount*`, `notes`, `terms`
   - Changer : `type='invoice'`, `status='draft'`, nouveau `number`, `date=today`, `dueDate=today+terms`
   - Ajouter : `convertedFromId = quote.id`
3. Copier toutes les lignes `document_items` avec le nouveau `documentId`
4. Mettre à jour le devis original : `status='converted'`, `convertedToId = newInvoice.id`
5. **Tout ceci dans une transaction SQLite** — si une étape échoue, rien n'est modifié
6. Naviguer vers la nouvelle facture en mode édition

**Ce que l'on ne fait PAS :**
- Supprimer le devis original
- Recalculer les prix
- Modifier les taux de TVA

---

## Monétisation — Stratégie Publicitaire Complète

### Règle fondamentale
Un utilisateur n'est **jamais bloqué**. Il a toujours le choix : regarder une pub ou payer Pro.

### Limite gratuite
```
FREE_PDF_LIMIT = 5 PDFs/mois   ← (pas 10)
```

PDFs 1-5 : générés directement, sans pub.  
PDF 6 et suivants : AdGateModal obligatoire.

### AdGate — Flux avant génération PDF
```
canGeneratePdfDirectly():
  → isPro = true           → OUI, générer directement
  → pdfCount < 5           → OUI, générer directement
  → pdfCount >= 5          → NON, afficher AdGateModal

AdGateModal :
  ┌─ "X/5 PDFs gratuits utilisés ce mois"
  ├─ [Regarder une pub — 30 sec] → showRewardedAd() → générer
  └─ [Passer à Pro — sans pub]   → UpgradeProScreen

Si pub non disponible (offline / timeout) :
  → Bypass automatique → générer quand même (jamais bloquer)
```

### Placement des publicités — Carte complète

| Écran | Format | Condition | Objectif |
|---|---|---|---|
| Dashboard | Banner bas | Toujours (gratuit) | Impressions constantes |
| Dashboard | Native card "Pro" | Toujours (gratuit) | Conversion Pro |
| DocumentListScreen | Banner bas | Toujours (gratuit) | Impressions + clics |
| DocumentListScreen | Native ad | Entre items (1/5 docs) | CTR élevé |
| ClientListScreen | Banner bas | Toujours (gratuit) | Impressions |
| ProductListScreen | Banner bas | Toujours (gratuit) | Impressions |
| SettingsScreen | Banner bas | Toujours (gratuit) | Impressions |
| Avant PDF 6+ | Rewarded 30 sec | pdfCount >= 5 | CPV élevé |
| Après "Marquer payée" | Interstitiel | 1 fois / facture | Moment positif = CTR élevé |
| **DocumentEditorScreen** | **AUCUNE pub** | **Toujours** | **Ne pas perturber le travail** |
| **PDFPreviewScreen** | **AUCUNE pub** | **Toujours** | **Ne pas perturber la satisfaction** |
| **UpgradeProScreen** | **AUCUNE pub** | **Toujours** | **Convertir sans distraire** |

### Pourquoi "Après facture payée" est le meilleur moment
L'utilisateur vient de recevoir de l'argent. Il est satisfait, réceptif. Une pub pour Revolut Business, Stripe, ou QuickBooks a un CTR 3x supérieur à ce moment-là.

### Stratégie CPM / CPC maximal — AdMob Mediation
Ne pas utiliser AdMob seul. Connecter plusieurs réseaux en enchères temps réel :
- **AdMob** (Google) — base
- **Meta Audience Network** — fort sur les pros
- **AppLovin MAX** — très bon sur Finance
- **ironSource** — excellent sur rewarded

Le plus offrant gagne chaque impression → CPM effectif +30 à +60%.

### Floor Price (Prix Plancher)
Dans AdMob : configurer un CPM minimum selon la région.
```
Europe :      floor = $3.00 CPM (rejette les pubs < $3)
Afrique Nord: floor = $0.80 CPM
Afrique sub:  floor = $0.30 CPM
USA/Canada :  floor = $8.00 CPM
```
→ Rejette les pubs de mauvaise qualité, garde seulement les annonceurs premium.

### Catégorie Play Store
Déclarer l'app en catégorie **"Finance"** dans le Play Store.  
Google cible automatiquement les annonceurs Finance (banques, SaaS comptable, paiement) qui paient 3-10× plus par clic que les annonceurs grand public.

### Reset mensuel
```
À chaque lancement de l'app :
  vérifier si mois courant ≠ lastResetMonth
  si oui : pdfCountThisMonth = 0, lastResetMonth = 'YYYY-MM'
```

### Ce que l'on NE fait JAMAIS
- Désactiver le bouton Enregistrer ou Éditer
- Griser une fonctionnalité à cause du tier gratuit
- Bloquer si la pub ne charge pas (toujours bypass)
- Mettre une pub sur l'éditeur ou la prévisualisation PDF

---

## Multi-devises (150+ ISO 4217)

- Devise définie **par document** (pas par client, pas globalement)
- La devise par défaut vient de `companySettings.defaultCurrencyCode`
- Le snapshot complet de la devise est stocké dans `documents` — le PDF reste exact même si les préférences changent
- Aucune conversion automatique en v1
- Formatage via `formatCurrency(amount, currencyConfig)` — jamais de symbole en dur

Devises prioritaires : EUR, USD, GBP, CHF, CAD, AUD, JPY, XAF, XOF, NGN, GHS, KES, ZAR, MAD, DZD, TND, EGP + toutes les autres ISO 4217.

---

## Internationalisation

- App UI : i18next, suit la locale de l'appareil (fallback : EN)
- PDF output : `document.language` ('fr' ou 'en'), **indépendant** de la langue de l'app
- Zéro chaîne en dur dans les composants — toujours `t('namespace:key')`
- Namespaces : `common`, `document`, `client`, `product`, `settings`, `pdf`, `monetization`, `onboarding`

---

## Stratégie 3 000 Utilisateurs (J+30 post-lancement)

### Levier 1 — Viral loop (PDF footer) — Principal
Chaque PDF partagé expose "Créé avec Facturo" à au moins un prospect.
Si un utilisateur envoie 5 PDFs/mois avec 10% de conversion → 0.5 utilisateur acquis par utilisateur actif.
Objectif : coefficient viral K > 0.4

### Levier 2 — ASO Play Store
- Titre : "Facturo – Factures & Devis PDF"
- Description optimisée : facture, devis, invoice, PDF, freelance, entrepreneur, TVA
- 8 captures d'écran haute qualité (French + English)
- Vidéo de démonstration 30 secondes
- Note cible : 4.5+ étoiles dès J+7 (demander un avis aux early users)

### Levier 3 — Seeding communautaire (pré-lancement + lancement)
- Groupes Facebook/WhatsApp : freelances, auto-entrepreneurs, comptables (Afrique + France)
- LinkedIn : post de lancement avec GIF démonstration
- Reddit : r/freelance, r/Entrepreneur, r/androidapps
- Forums comptabilité OHADA

### Levier 4 — Early Adopter Pro
- 50 premiers acheteurs Pro à 50% de réduction ("Fondateur")
- Incentive : badge "Fondateur" dans les releases notes

### Levier 5 — Bouton de partage intégré
- Dashboard : "Inviter un collègue" → deep link Play Store
- Après génération PDF : "Cet ami envoie des factures professionnelles avec Facturo"

### Métriques à suivre
- Téléchargements / jour
- Taux d'activation (>= 1 PDF généré)
- Taux conversion Free → Pro
- Coefficient viral (nouveaux users via footer)

---

## Conventions de Code

### TypeScript
- `strict: true` dans tsconfig — aucun `any`
- Types inférés depuis Drizzle — ne pas dupliquer les interfaces
- Pas de `as` sauf cas impossible autrement, commenté

### Composants React Native
- Fonctionnels uniquement, pas de classes
- Props : `interface Props {}` (pas de `type`)
- Suffixe `Screen` pour les écrans, pas de suffixe pour les composants partagés
- Styles : `StyleSheet.create` uniquement, jamais d'objet inline
- Pas de `useCallback`/`useMemo` par défaut — uniquement si profiling justifie

### Repositories
- Chaque méthode est `async`
- Toutes les erreurs remontent sans être avalées
- Transactions SQLite pour toute opération multi-tables

### Commits
```
feat(screen):  add client form with Zod validation [#9]
fix(pdf):      correct tax rounding in multi-rate case [#33]
chore(db):     add migration 0003_add_discount_column
```

---

## Règles Absolues (Ne Jamais Violer)

1. **Jamais bloquer l'utilisateur** — le modèle ad-gate est toujours contournable (pub ou upgrade)
2. **Jamais de symbole de devise en dur** — utiliser `formatCurrency(amount, config)`
3. **Jamais de chaîne UI en dur** — utiliser i18n
4. **Jamais appeler Drizzle directement depuis un Screen** — passer par un Repository
5. **Jamais de `any`** en TypeScript
6. **Jamais recalculer un document après génération PDF** — les totaux sont figés dans la DB
7. **Toujours utiliser une transaction SQLite** pour la conversion devis→facture
8. **Le schéma Drizzle est la source de vérité** des types — ne pas créer d'interfaces redondantes
9. **Le pied de page Facturo reste sur les PDFs gratuits** — c'est le levier de croissance, ne pas le retirer sans Pro
10. **Zéro API externe en v1** — l'app fonctionne entièrement hors ligne

---

## Migrations de Base de Données

```bash
# Générer une migration après modification de schema.ts
npx drizzle-kit generate

# Appliquer les migrations (développement)
npx drizzle-kit push
```

Les migrations sont appliquées automatiquement au lancement de l'app via `runMigrations()` dans `src/db/client.ts`. Les fichiers dans `src/db/migrations/` sont versionnés dans git — ne jamais les modifier manuellement.

---

## Variables d'Environnement (GitHub Secrets pour CI)

```
EXPO_TOKEN                — Authentication EAS
ADMOB_APP_ID_ANDROID      — AdMob App ID (production)
IAP_PRODUCT_ID_ONETIME    — Google Play product ID achat unique Pro
IAP_PRODUCT_ID_MONTHLY    — Google Play product ID abonnement mensuel
```

En développement : utiliser les IDs de test AdMob officiels.  
En production : injectés via `app.config.js` depuis `process.env`.

---

## Plan de Développement

Voir [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) — 42 jours ouvrables, 9 phases.

Règle de travail : commencer par l'issue `priority:critical` la plus basse en numéro.  
Chaque issue fermée = branch `feat/issue-N-titre` → PR → merge → fermer l'issue.
