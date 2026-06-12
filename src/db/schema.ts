// src/db/schema.ts
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// ─── clients ────────────────────────────────────────────────────────────────
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey().notNull(),
  type: text('type', { enum: ['individual', 'company'] }).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  countryCode: text('country_code').notNull().default('FR'),
  taxId: text('tax_id'),
  registrationNumber: text('registration_number'),
  defaultCurrencyCode: text('default_currency_code'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ─── products ───────────────────────────────────────────────────────────────
export const products = sqliteTable('products', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  unitPrice: real('unit_price').notNull().default(0),
  unit: text('unit').notNull().default('pcs'),
  category: text('category'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ─── taxRates ────────────────────────────────────────────────────────────────
export const taxRates = sqliteTable('tax_rates', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  rate: real('rate').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isCompound: integer('is_compound', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// ─── documents ───────────────────────────────────────────────────────────────
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey().notNull(),
  type: text('type', { enum: ['quote', 'invoice'] }).notNull(),
  status: text('status', {
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'converted'],
  })
    .notNull()
    .default('draft'),
  number: text('number'),
  date: text('date').notNull(),
  dueDate: text('due_date'),
  language: text('language', { enum: ['fr', 'en'] }).notNull().default('fr'),
  currencyCode: text('currency_code').notNull(),
  currencySymbol: text('currency_symbol').notNull(),
  currencySymbolPosition: text('currency_symbol_position').notNull().default('before'),
  currencyDecimalDigits: integer('currency_decimal_digits').notNull().default(2),
  currencyThousandsSep: text('currency_thousands_sep').notNull().default(','),
  currencyDecimalSep: text('currency_decimal_sep').notNull().default('.'),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  clientSnapshot: text('client_snapshot'), // JSON
  globalDiscountType: text('global_discount_type', { enum: ['percentage', 'fixed'] }),
  globalDiscountValue: real('global_discount_value'),
  subtotal: real('subtotal').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  taxableAmount: real('taxable_amount').notNull().default(0),
  taxTotal: real('tax_total').notNull().default(0),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  terms: text('terms'),
  // Self-referencing FKs — arrow returning `any` breaks the circular reference for Drizzle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  convertedFromId: text('converted_from_id').references((): any => documents.id, {
    onDelete: 'set null',
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  convertedToId: text('converted_to_id').references((): any => documents.id, {
    onDelete: 'set null',
  }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ─── documentItems ───────────────────────────────────────────────────────────
export const documentItems = sqliteTable('document_items', {
  id: text('id').primaryKey().notNull(),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  unit: text('unit').notNull().default('pcs'),
  discountType: text('discount_type', { enum: ['percentage', 'fixed'] }),
  discountValue: real('discount_value'),
  appliedTaxRateIds: text('applied_tax_rate_ids').notNull().default('[]'), // JSON array
  subtotal: real('subtotal').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  taxableAmount: real('taxable_amount').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  total: real('total').notNull().default(0),
});

// ─── companySettings ─────────────────────────────────────────────────────────
export const companySettings = sqliteTable('company_settings', {
  id: text('id').primaryKey().notNull().default('singleton'),
  name: text('name').notNull().default(''),
  logoUri: text('logo_uri'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  countryCode: text('country_code').notNull().default('FR'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  taxId: text('tax_id'),
  registrationNumber: text('registration_number'),
  defaultCurrencyCode: text('default_currency_code').notNull().default('EUR'),
  defaultLanguage: text('default_language', { enum: ['fr', 'en'] }).notNull().default('fr'),
  invoicePrefix: text('invoice_prefix').notNull().default('FAC'),
  invoiceCounter: integer('invoice_counter').notNull().default(0),
  quotePrefix: text('quote_prefix').notNull().default('DEV'),
  quoteCounter: integer('quote_counter').notNull().default(0),
  defaultPaymentTermsDays: integer('default_payment_terms_days').notNull().default(30),
  legalMentions: text('legal_mentions'),
  bankDetails: text('bank_details'),
});

// ─── appUsage ────────────────────────────────────────────────────────────────
export const appUsage = sqliteTable('app_usage', {
  id: text('id').primaryKey().notNull().default('singleton'),
  pdfCountThisMonth: integer('pdf_count_this_month').notNull().default(0),
  lastResetMonth: text('last_reset_month').notNull().default(''),
  isPro: integer('is_pro', { mode: 'boolean' }).notNull().default(false),
  hasSeenOnboarding: integer('has_seen_onboarding', { mode: 'boolean' }).notNull().default(false),
  proReceiptToken: text('pro_receipt_token'),
});

// ─── Inferred types ───────────────────────────────────────────────────────────
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type TaxRate = typeof taxRates.$inferSelect;
export type NewTaxRate = typeof taxRates.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type DocumentItem = typeof documentItems.$inferSelect;
export type NewDocumentItem = typeof documentItems.$inferInsert;

export type CompanySettings = typeof companySettings.$inferSelect;
export type NewCompanySettings = typeof companySettings.$inferInsert;

export type AppUsage = typeof appUsage.$inferSelect;
export type NewAppUsage = typeof appUsage.$inferInsert;
