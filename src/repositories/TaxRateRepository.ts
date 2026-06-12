// src/repositories/TaxRateRepository.ts

import { eq, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { generateId } from '@/utils/documentNumber';
import { today } from '@/utils/dateUtils';
import type { TaxRate, NewTaxRate } from '@/types';

export class TaxRateRepository {
  async findAll(): Promise<TaxRate[]> {
    return db
      .select()
      .from(schema.taxRates)
      .orderBy(asc(schema.taxRates.name));
  }

  async findById(id: string): Promise<TaxRate | null> {
    const rows = await db
      .select()
      .from(schema.taxRates)
      .where(eq(schema.taxRates.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findDefault(): Promise<TaxRate | null> {
    const rows = await db
      .select()
      .from(schema.taxRates)
      .where(eq(schema.taxRates.isDefault, true))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(data: NewTaxRate): Promise<TaxRate> {
    const id = data.id ?? (await generateId());
    const row: NewTaxRate = {
      ...data,
      id,
      createdAt: data.createdAt ?? today(),
    };

    await db.insert(schema.taxRates).values(row);

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`TaxRateRepository.create: row not found after insert (id=${id})`);
    }
    return created;
  }

  async update(id: string, data: Partial<NewTaxRate>): Promise<TaxRate> {
    await db
      .update(schema.taxRates)
      .set(data)
      .where(eq(schema.taxRates.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`TaxRateRepository.update: tax rate not found after update (id=${id})`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(schema.taxRates).where(eq(schema.taxRates.id, id));
  }

  /**
   * Set a single tax rate as the default.
   * Clears all other defaults first within a single SQLite transaction.
   */
  async setDefault(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.update(schema.taxRates).set({ isDefault: false });
      await tx
        .update(schema.taxRates)
        .set({ isDefault: true })
        .where(eq(schema.taxRates.id, id));
    });
  }
}

export const taxRateRepository = new TaxRateRepository();
