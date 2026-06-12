// src/db/seed.ts
import { randomUUID } from 'expo-crypto';
import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  clients,
  products,
  taxRates,
  companySettings,
  appUsage,
} from '@/db/schema';

const now = (): string => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
const today = (): string => format(new Date(), 'yyyy-MM-dd');

// ─── Guard: run once only ─────────────────────────────────────────────────────
async function isAlreadySeeded(): Promise<boolean> {
  const rows = await db
    .select({ id: companySettings.id })
    .from(companySettings)
    .limit(1);
  return rows.length > 0;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
async function seedTaxRates(): Promise<void> {
  const nowStr = now();

  await db.insert(taxRates).values([
    {
      id: randomUUID(),
      name: 'TVA 20%',
      rate: 20,
      isDefault: true,
      isCompound: false,
      createdAt: nowStr,
    },
    {
      id: randomUUID(),
      name: 'TVA 10%',
      rate: 10,
      isDefault: false,
      isCompound: false,
      createdAt: nowStr,
    },
  ]);
}

async function seedClients(): Promise<void> {
  const nowStr = now();
  const todayStr = today();

  await db.insert(clients).values([
    {
      id: randomUUID(),
      type: 'individual',
      name: 'Jean Dupont',
      email: 'paris@example.com',
      phone: '+33 6 12 34 56 78',
      addressLine1: '12 Rue de la Paix',
      addressLine2: null,
      city: 'Paris',
      state: 'Île-de-France',
      postalCode: '75001',
      countryCode: 'FR',
      taxId: null,
      registrationNumber: null,
      defaultCurrencyCode: 'EUR',
      notes: null,
      createdAt: nowStr,
      updatedAt: nowStr,
    },
  ]);
}

async function seedProducts(): Promise<void> {
  const nowStr = now();

  await db.insert(products).values([
    {
      id: randomUUID(),
      name: 'Développement web',
      description: 'Conception et développement de sites et applications web',
      unitPrice: 500,
      unit: 'jour',
      category: 'Services',
      createdAt: nowStr,
      updatedAt: nowStr,
    },
    {
      id: randomUUID(),
      name: 'Conseil',
      description: "Prestation de conseil et d'accompagnement",
      unitPrice: 200,
      unit: 'heure',
      category: 'Services',
      createdAt: nowStr,
      updatedAt: nowStr,
    },
  ]);
}

async function seedCompanySettings(): Promise<void> {
  await db.insert(companySettings).values([
    {
      id: 'singleton',
      name: '',
      logoUri: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      postalCode: null,
      countryCode: 'FR',
      phone: null,
      email: null,
      website: null,
      taxId: null,
      registrationNumber: null,
      defaultCurrencyCode: 'EUR',
      defaultLanguage: 'fr',
      invoicePrefix: 'FAC',
      invoiceCounter: 0,
      quotePrefix: 'DEV',
      quoteCounter: 0,
      defaultPaymentTermsDays: 30,
      legalMentions: null,
      bankDetails: null,
    },
  ]);
}

async function seedAppUsage(): Promise<void> {
  const currentMonth = format(new Date(), 'yyyy-MM');

  await db.insert(appUsage).values([
    {
      id: 'singleton',
      pdfCountThisMonth: 0,
      lastResetMonth: currentMonth,
      isPro: false,
      hasSeenOnboarding: false,
      proReceiptToken: null,
    },
  ]);
}

// ─── Public seed entry point ──────────────────────────────────────────────────
export async function runSeed(): Promise<void> {
  const alreadySeeded = await isAlreadySeeded();
  if (alreadySeeded) {
    return;
  }

  await seedCompanySettings();
  await seedAppUsage();
  await seedTaxRates();
  await seedClients();
  await seedProducts();
}
