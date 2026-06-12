// src/repositories/DocumentRepository.ts

import { eq, desc, asc, and, or, like, sql, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { generateId, generateDocumentNumber } from '@/utils/documentNumber';
import { today, addDays, getMonthKey } from '@/utils/dateUtils';
import type {
  Document,
  DocumentItem,
  DocumentWithItems,
  DocumentFilters,
  DocumentStats,
  CreateDocumentInput,
  UpdateDocumentInput,
  NewDocumentItem,
} from '@/types';

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class DocumentRepository {
  /**
   * Return documents matching optional filters.
   * All active filter conditions are combined with AND.
   */
  async findAll(filters?: DocumentFilters): Promise<Document[]> {
    const conditions = [];

    if (filters?.type) {
      conditions.push(eq(schema.documents.type, filters.type));
    }

    if (filters?.status) {
      conditions.push(
        eq(schema.documents.status, filters.status as Document['status']),
      );
    }

    if (filters?.clientId) {
      conditions.push(eq(schema.documents.clientId, filters.clientId));
    }

    if (filters?.dateFrom) {
      conditions.push(sql`${schema.documents.date} >= ${filters.dateFrom}`);
    }

    if (filters?.dateTo) {
      conditions.push(sql`${schema.documents.date} <= ${filters.dateTo}`);
    }

    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      const pattern = `%${filters.searchQuery.trim()}%`;
      conditions.push(
        or(
          like(schema.documents.number, pattern),
          like(schema.documents.clientSnapshot, pattern),
        ),
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn =
      filters?.sortBy === 'total'
        ? schema.documents.total
        : filters?.sortBy === 'number'
          ? schema.documents.number
          : schema.documents.date;

    const orderFn = filters?.sortOrder === 'asc' ? asc : desc;

    if (whereClause) {
      return db
        .select()
        .from(schema.documents)
        .where(whereClause)
        .orderBy(orderFn(sortColumn));
    }

    return db
      .select()
      .from(schema.documents)
      .orderBy(orderFn(sortColumn));
  }

  async findById(id: string): Promise<Document | null> {
    const rows = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findWithItems(id: string): Promise<DocumentWithItems | null> {
    const doc = await this.findById(id);
    if (!doc) return null;

    const items = await db
      .select()
      .from(schema.documentItems)
      .where(eq(schema.documentItems.documentId, id))
      .orderBy(asc(schema.documentItems.position));

    return { ...doc, items };
  }

  /**
   * Create a document together with its line items.
   * Increments the appropriate counter (invoice or quote) on companySettings.
   * Everything runs in a single SQLite transaction.
   */
  async create(data: CreateDocumentInput): Promise<DocumentWithItems> {
    const docId = await generateId();
    const now = new Date().toISOString();

    // Pre-generate item IDs outside the transaction (expo-crypto is async)
    const itemIds = await Promise.all(data.items.map(() => generateId()));

    return db.transaction(async (tx) => {
      await tx.insert(schema.documents).values({
        id: docId,
        type: data.type,
        status: data.status ?? 'draft',
        number: data.number,
        date: data.date,
        dueDate: data.dueDate ?? null,
        language: data.language ?? 'fr',
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
        currencySymbolPosition: data.currencySymbolPosition ?? 'before',
        currencyDecimalDigits: data.currencyDecimalDigits ?? 2,
        currencyThousandsSep: data.currencyThousandsSep ?? ',',
        currencyDecimalSep: data.currencyDecimalSep ?? '.',
        clientId: data.clientId ?? null,
        clientSnapshot: data.clientSnapshot,
        globalDiscountType: data.globalDiscountType ?? null,
        globalDiscountValue: data.globalDiscountValue ?? null,
        subtotal: data.subtotal ?? 0,
        discountAmount: data.discountAmount ?? 0,
        taxableAmount: data.taxableAmount ?? 0,
        taxTotal: data.taxTotal ?? 0,
        total: data.total ?? 0,
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        convertedFromId: data.convertedFromId ?? null,
        convertedToId: data.convertedToId ?? null,
        createdAt: now,
        updatedAt: now,
      });

      const itemRows: NewDocumentItem[] = data.items.map((item, index) => ({
        ...item,
        id: itemIds[index],
        documentId: docId,
        position: item.position ?? index,
      }));

      if (itemRows.length > 0) {
        await tx.insert(schema.documentItems).values(itemRows);
      }

      // Increment counter on companySettings
      const settingsRows = await tx
        .select()
        .from(schema.companySettings)
        .where(eq(schema.companySettings.id, 'singleton'))
        .limit(1);

      if (settingsRows[0]) {
        if (data.type === 'invoice') {
          await tx
            .update(schema.companySettings)
            .set({
              invoiceCounter: (settingsRows[0].invoiceCounter ?? 0) + 1,
            })
            .where(eq(schema.companySettings.id, 'singleton'));
        } else {
          await tx
            .update(schema.companySettings)
            .set({ quoteCounter: (settingsRows[0].quoteCounter ?? 0) + 1 })
            .where(eq(schema.companySettings.id, 'singleton'));
        }
      }

      const savedDoc = (
        await tx
          .select()
          .from(schema.documents)
          .where(eq(schema.documents.id, docId))
          .limit(1)
      )[0];

      const savedItems = await tx
        .select()
        .from(schema.documentItems)
        .where(eq(schema.documentItems.documentId, docId))
        .orderBy(asc(schema.documentItems.position));

      return { ...savedDoc, items: savedItems };
    });
  }

  /**
   * Update document header fields and replace all line items.
   * Totals must be recalculated and provided in `data` before calling.
   * Everything runs in a single SQLite transaction.
   */
  async update(
    id: string,
    data: UpdateDocumentInput,
  ): Promise<DocumentWithItems> {
    const now = new Date().toISOString();

    // Pre-generate item IDs outside the transaction
    const newItemIds = data.items
      ? await Promise.all(data.items.map(() => generateId()))
      : [];

    await db.transaction(async (tx) => {
      const { items, ...docFields } = data;

      await tx
        .update(schema.documents)
        .set({ ...docFields, updatedAt: now })
        .where(eq(schema.documents.id, id));

      if (items !== undefined) {
        await tx
          .delete(schema.documentItems)
          .where(eq(schema.documentItems.documentId, id));

        if (items.length > 0) {
          const itemRows: NewDocumentItem[] = items.map((item, index) => ({
            ...item,
            id: newItemIds[index],
            documentId: id,
            position: item.position ?? index,
          }));
          await tx.insert(schema.documentItems).values(itemRows);
        }
      }
    });

    const result = await this.findWithItems(id);
    if (!result) {
      throw new Error(
        `DocumentRepository.update: document not found after update (id=${id})`,
      );
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    // documentItems are cascade-deleted by the FK constraint
    await db.delete(schema.documents).where(eq(schema.documents.id, id));
  }

  /**
   * Convert a quote into a new draft invoice.
   *
   * Steps (all in one transaction):
   * 1. Load the original quote + its items
   * 2. Load companySettings for invoice number generation
   * 3. Insert new invoice (copied fields, type=invoice, status=draft,
   *    new number, date=today, dueDate=today+terms, convertedFromId=quoteId)
   * 4. Copy all line items with new IDs and new documentId
   * 5. Update quote: status=converted, convertedToId=newInvoice.id
   * 6. Increment invoiceCounter on companySettings
   */
  async convertQuoteToInvoice(quoteId: string): Promise<DocumentWithItems> {
    const quote = await this.findWithItems(quoteId);
    if (!quote) {
      throw new Error(
        `DocumentRepository.convertQuoteToInvoice: quote not found (id=${quoteId})`,
      );
    }
    if (quote.type !== 'quote') {
      throw new Error(
        `DocumentRepository.convertQuoteToInvoice: document is not a quote (id=${quoteId})`,
      );
    }

    const newInvoiceId = await generateId();
    const itemIds = await Promise.all(quote.items.map(() => generateId()));
    const todayStr = today();
    const now = new Date().toISOString();

    return db.transaction(async (tx) => {
      const settingsRows = await tx
        .select()
        .from(schema.companySettings)
        .where(eq(schema.companySettings.id, 'singleton'))
        .limit(1);

      const settings = settingsRows[0];
      const nextCounter = (settings?.invoiceCounter ?? 0) + 1;
      const invoicePrefix = settings?.invoicePrefix ?? 'FAC';
      const paymentTermsDays = settings?.defaultPaymentTermsDays ?? 30;
      const invoiceNumber = generateDocumentNumber(invoicePrefix, nextCounter);
      const dueDate = addDays(todayStr, paymentTermsDays);

      await tx.insert(schema.documents).values({
        id: newInvoiceId,
        type: 'invoice',
        status: 'draft',
        number: invoiceNumber,
        date: todayStr,
        dueDate,
        language: quote.language,
        currencyCode: quote.currencyCode,
        currencySymbol: quote.currencySymbol,
        currencySymbolPosition: quote.currencySymbolPosition,
        currencyDecimalDigits: quote.currencyDecimalDigits,
        currencyThousandsSep: quote.currencyThousandsSep,
        currencyDecimalSep: quote.currencyDecimalSep,
        clientId: quote.clientId,
        clientSnapshot: quote.clientSnapshot,
        globalDiscountType: quote.globalDiscountType,
        globalDiscountValue: quote.globalDiscountValue,
        subtotal: quote.subtotal,
        discountAmount: quote.discountAmount,
        taxableAmount: quote.taxableAmount,
        taxTotal: quote.taxTotal,
        total: quote.total,
        notes: quote.notes,
        terms: quote.terms,
        convertedFromId: quoteId,
        convertedToId: null,
        createdAt: now,
        updatedAt: now,
      });

      if (quote.items.length > 0) {
        const itemRows: NewDocumentItem[] = quote.items.map((item, index) => ({
          id: itemIds[index],
          documentId: newInvoiceId,
          position: item.position,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          discountType: item.discountType,
          discountValue: item.discountValue,
          appliedTaxRateIds: item.appliedTaxRateIds,
          subtotal: item.subtotal,
          discountAmount: item.discountAmount,
          taxableAmount: item.taxableAmount,
          taxAmount: item.taxAmount,
          total: item.total,
        }));
        await tx.insert(schema.documentItems).values(itemRows);
      }

      await tx
        .update(schema.documents)
        .set({ status: 'converted', convertedToId: newInvoiceId, updatedAt: now })
        .where(eq(schema.documents.id, quoteId));

      if (settings) {
        await tx
          .update(schema.companySettings)
          .set({ invoiceCounter: nextCounter })
          .where(eq(schema.companySettings.id, 'singleton'));
      }

      const newDoc = (
        await tx
          .select()
          .from(schema.documents)
          .where(eq(schema.documents.id, newInvoiceId))
          .limit(1)
      )[0];

      const newItems = await tx
        .select()
        .from(schema.documentItems)
        .where(eq(schema.documentItems.documentId, newInvoiceId))
        .orderBy(asc(schema.documentItems.position));

      return { ...newDoc, items: newItems };
    });
  }

  /**
   * Duplicate a document: new id, new number, status=draft, date=today,
   * convertedFromId and convertedToId cleared.
   */
  async duplicate(id: string): Promise<DocumentWithItems> {
    const source = await this.findWithItems(id);
    if (!source) {
      throw new Error(
        `DocumentRepository.duplicate: document not found (id=${id})`,
      );
    }

    const newId = await generateId();
    const itemIds = await Promise.all(source.items.map(() => generateId()));
    const todayStr = today();
    const now = new Date().toISOString();

    return db.transaction(async (tx) => {
      const settingsRows = await tx
        .select()
        .from(schema.companySettings)
        .where(eq(schema.companySettings.id, 'singleton'))
        .limit(1);

      const settings = settingsRows[0];
      let newNumber: string;
      let nextCounter: number;

      if (source.type === 'invoice') {
        nextCounter = (settings?.invoiceCounter ?? 0) + 1;
        newNumber = generateDocumentNumber(
          settings?.invoicePrefix ?? 'FAC',
          nextCounter,
        );
      } else {
        nextCounter = (settings?.quoteCounter ?? 0) + 1;
        newNumber = generateDocumentNumber(
          settings?.quotePrefix ?? 'DEV',
          nextCounter,
        );
      }

      await tx.insert(schema.documents).values({
        id: newId,
        type: source.type,
        status: 'draft',
        number: newNumber,
        date: todayStr,
        dueDate: source.dueDate,
        language: source.language,
        currencyCode: source.currencyCode,
        currencySymbol: source.currencySymbol,
        currencySymbolPosition: source.currencySymbolPosition,
        currencyDecimalDigits: source.currencyDecimalDigits,
        currencyThousandsSep: source.currencyThousandsSep,
        currencyDecimalSep: source.currencyDecimalSep,
        clientId: source.clientId,
        clientSnapshot: source.clientSnapshot,
        globalDiscountType: source.globalDiscountType,
        globalDiscountValue: source.globalDiscountValue,
        subtotal: source.subtotal,
        discountAmount: source.discountAmount,
        taxableAmount: source.taxableAmount,
        taxTotal: source.taxTotal,
        total: source.total,
        notes: source.notes,
        terms: source.terms,
        convertedFromId: null,
        convertedToId: null,
        createdAt: now,
        updatedAt: now,
      });

      if (source.items.length > 0) {
        const itemRows: NewDocumentItem[] = source.items.map((item, index) => ({
          id: itemIds[index],
          documentId: newId,
          position: item.position,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          discountType: item.discountType,
          discountValue: item.discountValue,
          appliedTaxRateIds: item.appliedTaxRateIds,
          subtotal: item.subtotal,
          discountAmount: item.discountAmount,
          taxableAmount: item.taxableAmount,
          taxAmount: item.taxAmount,
          total: item.total,
        }));
        await tx.insert(schema.documentItems).values(itemRows);
      }

      if (settings) {
        if (source.type === 'invoice') {
          await tx
            .update(schema.companySettings)
            .set({ invoiceCounter: nextCounter })
            .where(eq(schema.companySettings.id, 'singleton'));
        } else {
          await tx
            .update(schema.companySettings)
            .set({ quoteCounter: nextCounter })
            .where(eq(schema.companySettings.id, 'singleton'));
        }
      }

      const newDoc = (
        await tx
          .select()
          .from(schema.documents)
          .where(eq(schema.documents.id, newId))
          .limit(1)
      )[0];

      const newItems = await tx
        .select()
        .from(schema.documentItems)
        .where(eq(schema.documentItems.documentId, newId))
        .orderBy(asc(schema.documentItems.position));

      return { ...newDoc, items: newItems };
    });
  }

  /**
   * Compute aggregated stats for the current calendar month.
   */
  async getStats(): Promise<DocumentStats> {
    const currentMonth = getMonthKey();

    const rows = await db.select().from(schema.documents);

    const thisMonthInvoices = rows.filter(
      (d) => d.type === 'invoice' && d.date.startsWith(currentMonth),
    );

    const totalThisMonth = thisMonthInvoices.reduce(
      (sum, d) => sum + d.total,
      0,
    );

    const paidThisMonth = thisMonthInvoices
      .filter((d) => d.status === 'paid')
      .reduce((sum, d) => sum + d.total, 0);

    const pendingAmount = rows
      .filter(
        (d) =>
          d.type === 'invoice' &&
          (d.status === 'sent' || d.status === 'draft'),
      )
      .reduce((sum, d) => sum + d.total, 0);

    const overdueCount = rows.filter(
      (d) => d.type === 'invoice' && d.status === 'overdue',
    ).length;

    const allQuotes = rows.filter((d) => d.type === 'quote');
    const convertedQuotes = allQuotes.filter(
      (d) => d.status === 'converted',
    ).length;
    const conversionRate =
      allQuotes.length > 0 ? convertedQuotes / allQuotes.length : 0;

    return {
      totalThisMonth,
      paidThisMonth,
      pendingAmount,
      overdueCount,
      conversionRate,
    };
  }

  /**
   * Return monthly revenue breakdown for the last N months (oldest first).
   * Only invoice documents are counted.
   */
  async getMonthlyRevenue(
    months: number,
  ): Promise<{ month: string; invoiced: number; paid: number }[]> {
    const rows = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.type, 'invoice'));

    // Pre-fill all months so gaps are included as zero
    const now = new Date();
    const map = new Map<string, { invoiced: number; paid: number }>();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, { invoiced: 0, paid: 0 });
    }

    for (const doc of rows) {
      const month = doc.date.substring(0, 7);
      if (!map.has(month)) continue;
      const entry = map.get(month)!;
      entry.invoiced += doc.total;
      if (doc.status === 'paid') {
        entry.paid += doc.total;
      }
    }

    return Array.from(map.entries())
      .map(([month, values]) => ({ month, ...values }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}

export const documentRepository = new DocumentRepository();
