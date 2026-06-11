# Facturo

**Professional invoicing, anywhere in the world.**

Facturo is a mobile application for creating quotes and invoices in PDF format — fast, offline-first, multi-currency, and multilingual. Built with Expo (React Native) for Android, with Play Store deployment.

---

## Features

### Core
- Create, edit, and manage **quotes** and **invoices**
- Convert an accepted **quote into an invoice** in one tap
- Duplicate any document to create a new one from it
- **Draft auto-save** — never lose your work

### Clients & Products
- Full **client management** (individuals and companies)
- **Product/service catalog** with custom units (h, kg, pcs, etc.)
- Zod-validated forms with smart defaults

### Financial Engine
- **Multi-currency** — choose any currency per document (EUR, USD, GBP, XAF, XOF, NGN, MAD, KES, and 150+ more)
- **Multiple tax rates** per document (VAT, AIR, GST, etc.) — fully configurable
- **Line-level and global discounts** (percentage or fixed amount)
- Automatic calculation: subtotal → discounts → taxes → total

### PDF Generation
- Clean, professional PDF templates
- Company logo, legal mentions, payment terms
- **BROUILLON** watermark on drafts
- Share via WhatsApp, Gmail, Telegram, or any app
- Download to device / print

### Multilingual
- App interface: **French** and **English** (extensible)
- PDF output language: selectable per document

### Monetization (Ad-Gate Model)
- **Free tier**: unlimited use — no feature lock
- After 10 PDFs/month: watch a **30-second rewarded ad** to continue (never a hard block)
- **Pro upgrade**: removes all ads (one-time purchase or subscription)
- No user is ever prevented from doing their work

### Advanced
- Statistics dashboard (revenue, document counts)
- Local notifications for payment due dates
- Backup/restore data (JSON export/import)
- Onboarding for first-time users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) (React Native) + TypeScript |
| State | [Zustand](https://zustand-demo.pmnd.rs) + AsyncStorage |
| Forms | [Zod](https://zod.dev) validation |
| Navigation | [React Navigation v6](https://reactnavigation.org) |
| PDF | `expo-print` / `react-native-html-to-pdf` |
| i18n | `i18next` + `expo-localization` |
| Ads | `react-native-google-mobile-ads` (AdMob) |
| IAP | `expo-in-app-purchases` or `react-native-iap` |
| Build | [EAS Build](https://docs.expo.dev/build/introduction/) |
| CI/CD | GitHub Actions + EAS |

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/Bricestepahene/facturo.git
cd facturo

# 2. Install dependencies
npm install

# 3. Start dev server
npx expo start

# 4. Run on Android
npx expo run:android
```

**Prerequisites**: Node 18+, Expo CLI, Android Studio (for emulator) or physical device with Expo Go.

---

## Project Structure

```
src/
├── components/     # Shared UI components
├── screens/        # Screen-level components
├── store/          # Zustand state stores
├── types/          # TypeScript models
├── services/       # Business logic (PDF, IAP, ads)
├── utils/          # Pure helpers (currency, calculations)
├── i18n/           # Translation files (en, fr)
├── theme/          # Design tokens (colors, typography)
└── navigation/     # React Navigation config
```

---

## Monetization Model

Facturo uses an **ad-gate model** — users are never blocked from their work:

1. Free tier: full access to all features
2. After the monthly PDF quota (10/month): a 30-second rewarded ad unlocks the next PDF
3. Pro upgrade eliminates ads entirely

This ensures 100% user retention while creating a clear upgrade incentive.

---

## Roadmap

See [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for the complete day-by-day development plan.

Open issues are tracked on [GitHub Issues](https://github.com/Bricestepahene/facturo/issues).

---

## License

MIT
