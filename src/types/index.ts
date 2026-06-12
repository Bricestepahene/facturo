// src/types/index.ts

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from '@/db/schema';

// ---------------------------------------------------------------------------
// Drizzle-inferred base types
// ---------------------------------------------------------------------------

export type Client = InferSelectModel<typeof schema.clients>;
export type NewClient = InferInsertModel<typeof schema.clients>;

export type Product = InferSelectModel<typeof schema.products>;
export type NewProduct = InferInsertModel<typeof schema.products>;

export type TaxRate = InferSelectModel<typeof schema.taxRates>;
export type NewTaxRate = InferInsertModel<typeof schema.taxRates>;

export type Document = InferSelectModel<typeof schema.documents>;
export type NewDocument = InferInsertModel<typeof schema.documents>;

export type DocumentItem = InferSelectModel<typeof schema.documentItems>;
export type NewDocumentItem = InferInsertModel<typeof schema.documentItems>;

export type CompanySettings = InferSelectModel<typeof schema.companySettings>;
export type NewCompanySettings = InferInsertModel<typeof schema.companySettings>;

export type AppUsage = InferSelectModel<typeof schema.appUsage>;
export type NewAppUsage = InferInsertModel<typeof schema.appUsage>;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type DocumentType = 'invoice' | 'quote';

export type DocumentStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'converted';

export type DiscountType = 'percentage' | 'fixed';

// ---------------------------------------------------------------------------
// Composite types (not stored in DB)
// ---------------------------------------------------------------------------

export type DocumentWithItems = Document & { items: DocumentItem[] };

export type CurrencyConfig = {
  code: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalDigits: number;
  thousandsSep: string;
  decimalSep: string;
};

export type DocumentFilters = {
  type?: 'invoice' | 'quote';
  status?: string;
  searchQuery?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'total' | 'number';
  sortOrder?: 'asc' | 'desc';
};

export type DocumentStats = {
  totalThisMonth: number;
  paidThisMonth: number;
  pendingAmount: number;
  overdueCount: number;
  conversionRate: number;
};

export type CreateDocumentInput = {
  type: DocumentType;
  status?: DocumentStatus;
  number: string;
  date: string;
  dueDate?: string | null;
  language?: 'fr' | 'en';
  currencyCode: string;
  currencySymbol: string;
  currencySymbolPosition?: string;
  currencyDecimalDigits?: number;
  currencyThousandsSep?: string;
  currencyDecimalSep?: string;
  clientId?: string | null;
  clientSnapshot: string;
  globalDiscountType?: DiscountType | null;
  globalDiscountValue?: number | null;
  subtotal?: number;
  discountAmount?: number;
  taxableAmount?: number;
  taxTotal?: number;
  total?: number;
  notes?: string | null;
  terms?: string | null;
  convertedFromId?: string | null;
  convertedToId?: string | null;
  items: Omit<NewDocumentItem, 'id' | 'documentId'>[];
};

export type UpdateDocumentInput = Partial<CreateDocumentInput>;

export type LineItemCalculation = {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
};

export type TaxLine = {
  taxRateId: string;
  name: string;
  rate: number;
  baseAmount: number;
  taxAmount: number;
};

export type DocumentCalculation = LineItemCalculation & {
  taxLines: TaxLine[];
};
