// src/db/migrations/index.ts
// Bundled migration for drizzle-orm/expo-sqlite/migrator

const INITIAL_SQL = `CREATE TABLE IF NOT EXISTS \`clients\` (
\`id\` text PRIMARY KEY NOT NULL,
\`type\` text NOT NULL,
\`name\` text NOT NULL,
\`email\` text,
\`phone\` text,
\`address_line1\` text,
\`address_line2\` text,
\`city\` text,
\`state\` text,
\`postal_code\` text,
\`country_code\` text NOT NULL DEFAULT 'FR',
\`tax_id\` text,
\`registration_number\` text,
\`default_currency_code\` text,
\`notes\` text,
\`created_at\` text NOT NULL,
\`updated_at\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`products\` (
\`id\` text PRIMARY KEY NOT NULL,
\`name\` text NOT NULL,
\`description\` text,
\`unit_price\` real NOT NULL DEFAULT 0,
\`unit\` text NOT NULL DEFAULT 'pcs',
\`category\` text,
\`created_at\` text NOT NULL,
\`updated_at\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`tax_rates\` (
\`id\` text PRIMARY KEY NOT NULL,
\`name\` text NOT NULL,
\`rate\` real NOT NULL,
\`is_default\` integer NOT NULL DEFAULT false,
\`is_compound\` integer NOT NULL DEFAULT false,
\`created_at\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`documents\` (
\`id\` text PRIMARY KEY NOT NULL,
\`type\` text NOT NULL,
\`status\` text NOT NULL DEFAULT 'draft',
\`number\` text,
\`date\` text NOT NULL,
\`due_date\` text,
\`language\` text NOT NULL DEFAULT 'fr',
\`currency_code\` text NOT NULL,
\`currency_symbol\` text NOT NULL,
\`currency_symbol_position\` text NOT NULL DEFAULT 'before',
\`currency_decimal_digits\` integer NOT NULL DEFAULT 2,
\`currency_thousands_sep\` text NOT NULL DEFAULT ',',
\`currency_decimal_sep\` text NOT NULL DEFAULT '.',
\`client_id\` text REFERENCES \`clients\`(\`id\`) ON DELETE set null,
\`client_snapshot\` text,
\`global_discount_type\` text,
\`global_discount_value\` real,
\`subtotal\` real NOT NULL DEFAULT 0,
\`discount_amount\` real NOT NULL DEFAULT 0,
\`taxable_amount\` real NOT NULL DEFAULT 0,
\`tax_total\` real NOT NULL DEFAULT 0,
\`total\` real NOT NULL DEFAULT 0,
\`notes\` text,
\`terms\` text,
\`converted_from_id\` text,
\`converted_to_id\` text,
\`created_at\` text NOT NULL,
\`updated_at\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`document_items\` (
\`id\` text PRIMARY KEY NOT NULL,
\`document_id\` text NOT NULL REFERENCES \`documents\`(\`id\`) ON DELETE cascade,
\`position\` integer NOT NULL,
\`product_id\` text REFERENCES \`products\`(\`id\`) ON DELETE set null,
\`description\` text NOT NULL,
\`quantity\` real NOT NULL DEFAULT 1,
\`unit_price\` real NOT NULL DEFAULT 0,
\`unit\` text NOT NULL DEFAULT 'pcs',
\`discount_type\` text,
\`discount_value\` real,
\`applied_tax_rate_ids\` text NOT NULL DEFAULT '[]',
\`subtotal\` real NOT NULL DEFAULT 0,
\`discount_amount\` real NOT NULL DEFAULT 0,
\`taxable_amount\` real NOT NULL DEFAULT 0,
\`tax_amount\` real NOT NULL DEFAULT 0,
\`total\` real NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`company_settings\` (
\`id\` text PRIMARY KEY NOT NULL DEFAULT 'singleton',
\`name\` text NOT NULL DEFAULT '',
\`logo_uri\` text,
\`address_line1\` text,
\`address_line2\` text,
\`city\` text,
\`state\` text,
\`postal_code\` text,
\`country_code\` text NOT NULL DEFAULT 'FR',
\`phone\` text,
\`email\` text,
\`website\` text,
\`tax_id\` text,
\`registration_number\` text,
\`default_currency_code\` text NOT NULL DEFAULT 'EUR',
\`default_language\` text NOT NULL DEFAULT 'fr',
\`invoice_prefix\` text NOT NULL DEFAULT 'FAC',
\`invoice_counter\` integer NOT NULL DEFAULT 0,
\`quote_prefix\` text NOT NULL DEFAULT 'DEV',
\`quote_counter\` integer NOT NULL DEFAULT 0,
\`default_payment_terms_days\` integer NOT NULL DEFAULT 30,
\`legal_mentions\` text,
\`bank_details\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`app_usage\` (
\`id\` text PRIMARY KEY NOT NULL DEFAULT 'singleton',
\`pdf_count_this_month\` integer NOT NULL DEFAULT 0,
\`last_reset_month\` text NOT NULL DEFAULT '',
\`is_pro\` integer NOT NULL DEFAULT false,
\`has_seen_onboarding\` integer NOT NULL DEFAULT false,
\`pro_receipt_token\` text
);`;

export default {
  journal: {
    entries: [
      {
        idx: 0,
        version: '5',
        when: 1717200000000,
        tag: '0000_initial',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    '0000_initial': INITIAL_SQL,
  },
};
