// src/repositories/ProductRepository.ts

import { eq, desc, like, or } from 'drizzle-orm';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { generateId } from '@/utils/documentNumber';
import { today } from '@/utils/dateUtils';
import type { Product, NewProduct } from '@/types';

export class ProductRepository {
  async findAll(searchQuery?: string): Promise<Product[]> {
    if (searchQuery && searchQuery.trim().length > 0) {
      const pattern = `%${searchQuery.trim()}%`;
      return db
        .select()
        .from(schema.products)
        .where(
          or(
            like(schema.products.name, pattern),
            like(schema.products.description, pattern),
          ),
        )
        .orderBy(desc(schema.products.updatedAt));
    }

    return db
      .select()
      .from(schema.products)
      .orderBy(desc(schema.products.updatedAt));
  }

  async findById(id: string): Promise<Product | null> {
    const rows = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(data: NewProduct): Promise<Product> {
    const id = data.id ?? (await generateId());
    const now = today();
    const row: NewProduct = {
      ...data,
      id,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    };

    await db.insert(schema.products).values(row);

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`ProductRepository.create: row not found after insert (id=${id})`);
    }
    return created;
  }

  async update(id: string, data: Partial<NewProduct>): Promise<Product> {
    await db
      .update(schema.products)
      .set({ ...data, updatedAt: today() })
      .where(eq(schema.products.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`ProductRepository.update: product not found after update (id=${id})`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(schema.products).where(eq(schema.products.id, id));
  }
}

export const productRepository = new ProductRepository();
