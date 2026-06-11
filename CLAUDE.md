# Facturo — Claude Code Instructions

## Project Overview

Facturo is a cross-platform mobile invoicing application built with Expo (React Native) and TypeScript. It targets freelancers, SMEs, and entrepreneurs worldwide — not limited to any specific region or currency. The goal is to ship a clean, monetized app on Google Play Store.

**Working directory**: project root  
**Primary language**: TypeScript (strict mode)  
**Platform**: Android (Play Store), iOS future  
**Build tool**: EAS Build via Expo

---

## Vision & Positioning

- **Global**: Any currency, any language, any country. Never hard-code region-specific logic.
- **Offline-first**: All data lives on device (AsyncStorage via Zustand persist). No backend required.
- **Ad-gate monetization**: Users are NEVER blocked. They always have a path to continue (30-sec ad). Paying removes ads.
- **Professional quality**: PDFs must look indistinguishable from Word/Excel-generated invoices.

---

## Tech Stack

```
Framework:   Expo SDK 51+ (React Native)
Language:    TypeScript (strict: true)
State:       Zustand + @react-native-async-storage/async-storage
Navigation:  React Navigation v6 (Bottom tabs + Stack)
Forms:       react-hook-form + Zod
PDF:         expo-print + expo-sharing
i18n:        i18next + react-i18next + expo-localization
Ads:         react-native-google-mobile-ads (AdMob rewarded + banner)
IAP:         expo-in-app-purchases
Build:       EAS Build (eas.json)
CI/CD:       GitHub Actions → EAS
Lint/Format: ESLint + Prettier
```

---

## Project Structure

```
facturo/
├── src/
│   ├── components/
│   │   ├── common/          # Button, Input, Card, Modal, Badge, etc.
│   │   ├── forms/           # LineItemRow, ClientPicker, TaxSelector, etc.
│   │   └── pdf/             # PDF HTML template builders
│   ├── screens/
│   │   ├── dashboard/       # DashboardScreen
│   │   ├── documents/       # DocumentListScreen, DocumentEditorScreen
│   │   ├── preview/         # PDFPreviewScreen
│   │   ├── clients/         # ClientListScreen, ClientFormScreen
│   │   ├── products/        # ProductListScreen, ProductFormScreen
│   │   ├── settings/        # SettingsScreen, CompanyProfileScreen
│   │   ├── onboarding/      # OnboardingScreen
│   │   └── upgrade/         # UpgradeProScreen
│   ├── store/
│   │   ├── clientsStore.ts
│   │   ├── documentsStore.ts
│   │   ├── productsStore.ts
│   │   ├── settingsStore.ts
│   │   └── usageStore.ts    # PDF counter, ad-gate state
│   ├── types/
│   │   ├── document.types.ts
│   │   ├── client.types.ts
│   │   ├── product.types.ts
│   │   ├── settings.types.ts
│   │   └── currency.types.ts
│   ├── services/
│   │   ├── pdf/
│   │   │   ├── pdfGenerator.ts     # HTML → PDF via expo-print
│   │   │   ├── pdfTemplate.ts      # HTML template builder
│   │   │   └── pdfSharing.ts       # Share/download/print
│   │   ├── monetization/
│   │   │   ├── adGate.ts           # Ad-gate logic + rewarded ad trigger
│   │   │   └── iap.ts              # In-app purchase + restore
│   │   └── storage/
│   │       └── backupRestore.ts    # JSON export/import
│   ├── utils/
│   │   ├── currency.ts      # Currency formatting, supported list
│   │   ├── calculations.ts  # Subtotal, tax, discount, total
│   │   ├── invoiceNumber.ts # Auto-increment with prefix
│   │   └── dateUtils.ts
│   ├── i18n/
│   │   ├── en.json
│   │   ├── fr.json
│   │   └── index.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   └── navigation/
│       └── AppNavigator.tsx
├── assets/
├── docs/
│   ├── DEVELOPMENT_PLAN.md
│   └── ARCHITECTURE.md
├── .github/
│   └── workflows/
│       └── eas-build.yml
├── app.json
├── eas.json
├── CLAUDE.md
└── README.md
```

---

## Core Data Models

### Document (Invoice / Quote)

```typescript
// src/types/document.types.ts

type DocumentType = 'quote' | 'invoice';
type DocumentStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'converted'; // quote was converted to invoice

interface Document {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  number: string;            // e.g. "FAC-2026-001"
  date: string;              // ISO date
  dueDate?: string;
  language: 'fr' | 'en';    // PDF output language
  currency: CurrencyConfig;

  clientId: string;
  clientSnapshot: ClientSnapshot; // copy at time of creation

  items: LineItem[];
  globalDiscount?: Discount;
  taxes: TaxLine[];

  subtotal: number;          // sum of item totals before discount/tax
  discountAmount: number;    // global discount amount
  taxableAmount: number;     // subtotal - discountAmount
  taxTotal: number;          // sum of all tax lines
  total: number;             // taxableAmount + taxTotal

  notes?: string;
  terms?: string;

  convertedFromId?: string;  // if this invoice was created from a quote
  convertedToId?: string;    // if this quote was converted (links to invoice)

  isPro?: boolean;           // generated without ad by Pro user
  createdAt: string;
  updatedAt: string;
}

interface LineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;              // 'h', 'kg', 'pcs', 'day', 'forfait', etc.
  discount?: Discount;
  appliedTaxRateIds: string[];

  // Computed
  subtotal: number;          // quantity * unitPrice
  discountAmount: number;
  taxableAmount: number;     // subtotal - discountAmount
  taxAmount: number;
  total: number;
}

interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

interface TaxLine {
  taxRateId: string;
  name: string;              // e.g. "TVA 20%"
  rate: number;              // 20
  base: number;              // taxable amount this tax applies to
  amount: number;
}
```

### Currency

```typescript
// src/types/currency.types.ts

interface CurrencyConfig {
  code: string;              // ISO 4217: EUR, USD, XAF, GBP...
  symbol: string;            // €, $, FCFA, £
  symbolPosition: 'before' | 'after';
  decimalDigits: number;     // 2 for EUR/USD, 0 for XAF/XOF
  thousandsSep: string;      // ' ', ',', '.'
  decimalSep: string;        // '.', ','
}

// Must support 150+ ISO currencies. Commonly used:
// EUR, USD, GBP, CHF, CAD, AUD, JPY, CNY
// XAF (FCFA), XOF (CFA), NGN, GHS, KES, ZAR, MAD, DZD, EGP
// Format currency amounts using this config — never hard-code symbols
```

### Tax Rate

```typescript
interface TaxRate {
  id: string;
  name: string;    // user-defined: "TVA", "VAT", "AIR", "GST", "HST"
  rate: number;    // 0-100
  isDefault: boolean;
  isCompound: boolean; // applied on top of other taxes
}
```

### Client

```typescript
interface Client {
  id: string;
  type: 'individual' | 'company';
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  countryCode: string;        // ISO 3166-1 alpha-2
  taxId?: string;             // NIU, NIF, VAT number, etc.
  registrationNumber?: string; // RCCM, SIRET, etc.
  defaultCurrencyCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}
```

### Company Settings

```typescript
interface CompanySettings {
  name: string;
  logoUri?: string;
  address?: Address;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;

  defaultCurrencyCode: string;
  defaultTaxRates: TaxRate[];

  invoicePrefix: string;      // e.g. "FAC"
  invoiceCounter: number;
  quotePrefix: string;        // e.g. "DEV"
  quoteCounter: number;

  defaultPaymentTermsDays: number; // 30
  defaultLanguage: 'fr' | 'en';
  legalMentions?: string;
  bankDetails?: string;
}
```

---

## Business Rules

### Invoice Numbering
- Format: `{PREFIX}-{YEAR}-{COUNTER:03d}` → `FAC-2026-001`
- Counter auto-increments in settings store, never resets mid-year
- Prefix and counter are configurable in settings
- Quotes and invoices have separate sequences

### Quote → Invoice Conversion
1. Duplicate all document data (client snapshot, items, taxes, currency)
2. Set new document type to `'invoice'`
3. Reset: new number, today's date, due date = today + defaultPaymentTermsDays
4. Set status to `'draft'`
5. Set `convertedFromId` on the new invoice
6. Set `convertedToId` on the original quote + change quote status to `'converted'`
7. User reviews and confirms before saving

### Financial Calculations (EXACT — no rounding errors)
```
itemSubtotal    = quantity × unitPrice
itemDiscount    = if type='percentage': itemSubtotal × (value/100), else: value
itemTaxable     = itemSubtotal - itemDiscount
itemTax         = sum(taxRate.rate/100 × itemTaxable) for each applied tax
itemTotal       = itemTaxable + itemTax

docSubtotal     = sum(item.itemSubtotal)
docDiscount     = if type='percentage': docSubtotal × (value/100), else: value
docTaxable      = docSubtotal - docDiscount
taxLines        = group by taxRateId, sum bases and amounts
docTaxTotal     = sum(taxLine.amount)
docTotal        = docTaxable + docTaxTotal
```
- Always work in the document currency (no conversion)
- Round only for display, not for intermediate calculations
- Use `toFixed(currency.decimalDigits)` for display

### Monetization — Ad-Gate Model
```
RULE: A user is NEVER blocked from their work.

Free tier:
  - pdfCountThisMonth < FREE_LIMIT (10) → generate PDF directly
  - pdfCountThisMonth >= FREE_LIMIT    → show AdGateModal
    ├── Watch 30-sec rewarded ad → ad completes → generate PDF
    └── Upgrade to Pro button → UpgradeProScreen

Pro tier:
  - isPro = true → generate PDF directly, no ad, no counter

Usage counter:
  - Incremented in usageStore on successful PDF generation
  - Reset on first day of each month (checked on app launch)
  - Persisted in AsyncStorage

Never:
  - Never disable Save/Edit because of free tier
  - Never hide features because of free tier
  - Never show the ad modal on non-PDF actions
```

### Multi-Currency
- Currency is set per document (not per client or global)
- Default currency comes from CompanySettings
- All 150+ ISO 4217 currencies must be selectable
- Currency formatting uses `CurrencyConfig` — never hard-code symbols
- No real-time exchange rates in v1 (prices are entered in the document's currency)

### Multi-Language
- App UI: i18next, follows device locale (fallback: English)
- PDF output: `document.language` field ('fr' or 'en'), independent of app language
- All user-facing strings must be in translation files — no hard-coded strings
- Translation keys: snake_case, grouped by screen

---

## Screens & Navigation

```
Tab Navigator (bottom tabs):
├── Dashboard          (DashboardScreen)
├── Documents          (DocumentListScreen)
│   └── [Stack] DocumentEditorScreen
│       └── [Modal] PDFPreviewScreen
├── Clients            (ClientListScreen)
│   └── [Stack] ClientFormScreen
├── Products           (ProductListScreen)
│   └── [Stack] ProductFormScreen
└── Settings           (SettingsScreen)
    ├── CompanyProfileScreen
    ├── TaxRatesScreen
    ├── UpgradeProScreen
    └── BackupRestoreScreen

Modal:
├── OnboardingScreen   (first launch only)
└── AdGateModal        (before PDF when limit reached)
```

---

## Component Conventions

- Functional components only, no class components
- Props typed with `interface`, not `type` alias
- Screens suffix: `Screen` (e.g. `DashboardScreen`)
- Shared components: PascalCase, in `src/components/common/`
- No inline styles — use `StyleSheet.create` or theme tokens
- No `any` type — use proper types or `unknown`
- `useCallback` / `useMemo` only when measurably needed

---

## State (Zustand) Conventions

- One store per domain: clients, documents, products, settings, usage
- Persist all stores with `zustand/middleware` → AsyncStorage
- Store shape: `{ items: T[], actions: { ... } }`
- Actions are methods inside the store, not external functions
- Never mutate state directly — use `set(state => ...)` pattern

---

## PDF Templates

- Generated via HTML string → `expo-print`
- Template is a pure function: `(document, company) => string`
- Must look professional: tables, proper spacing, logo placement
- Currency formatting via `formatCurrency(amount, currencyConfig)`
- i18n labels in PDF: driven by `document.language`, not app locale
- Always test output on real device (PDF rendering differs by OS)
- "BROUILLON" / "DRAFT" watermark when `status === 'draft'`

---

## Absolute Rules

1. **Never block a user** — monetization is always opt-in ad-watch or upgrade
2. **Never hard-code currency symbols** — use `CurrencyConfig`
3. **Never hard-code language strings** — use i18n keys
4. **Never assume OHADA/CEMAC context** — app is global
5. **No backend, no API calls** — fully offline (v1)
6. **No `any` type** in TypeScript
7. **Calculations must be exact** — no premature rounding
8. **Quote→Invoice conversion must be reversible** (original quote preserved)

---

## Git Conventions

```
Branch naming:  feat/issue-{N}-short-description
                fix/issue-{N}-short-description
Commit format:  feat(screen): add client list with search [#9]
                fix(pdf): correct tax calculation rounding [#12]
PR:             title = issue title, body references issue number
```

---

## Testing Strategy

- Unit tests: pure utils (calculations, currency formatting, invoice numbering)
- Integration: store actions with AsyncStorage mock
- E2E: not in v1 (manual QA checklist before release)
- Test files: co-located `*.test.ts` next to source

---

## Environment & Secrets

Required in GitHub Secrets for CI/CD:
- `EXPO_TOKEN` — EAS authentication
- `ADMOB_APP_ID_ANDROID` — AdMob app ID
- `IAP_PRODUCT_ID_ONETIME` — Google Play product ID for one-time Pro purchase
- `IAP_PRODUCT_ID_MONTHLY` — Google Play product ID for monthly subscription

Never commit these values — use `app.config.js` + `process.env`.

---

## Development Plan

Full day-by-day plan: [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)

Total estimated duration: **40 working days** across 8 phases.
