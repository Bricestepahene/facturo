// src/repositories/ClientRepository.ts

import { eq, desc, like, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { generateId } from '@/utils/documentNumber';
import { today } from '@/utils/dateUtils';
import type { Client, NewClient } from '@/types';

export class ClientRepository {
  async findAll(searchQuery?: string): Promise<Client[]> {
    if (searchQuery && searchQuery.trim().length > 0) {
      const pattern = `%${searchQuery.trim()}%`;
      return db
        .select()
        .from(schema.clients)
        .where(
          or(
            like(schema.clients.name, pattern),
            like(schema.clients.email, pattern),
          ),
        )
        .orderBy(desc(schema.clients.updatedAt));
    }

    return db
      .select()
      .from(schema.clients)
      .orderBy(desc(schema.clients.updatedAt));
  }

  async findById(id: string): Promise<Client | null> {
    const rows = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(data: NewClient): Promise<Client> {
    const id = data.id ?? (await generateId());
    const now = today();
    const row: NewClient = {
      ...data,
      id,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    };

    await db.insert(schema.clients).values(row);

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`ClientRepository.create: row not found after insert (id=${id})`);
    }
    return created;
  }

  async update(id: string, data: Partial<NewClient>): Promise<Client> {
    await db
      .update(schema.clients)
      .set({ ...data, updatedAt: today() })
      .where(eq(schema.clients.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`ClientRepository.update: client not found after update (id=${id})`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(schema.clients).where(eq(schema.clients.id, id));
  }

  async getStats(clientId: string): Promise<{ totalInvoiced: number; documentCount: number }> {
    const rows = await db
      .select({
        totalInvoiced: sql<number>`COALESCE(SUM(${schema.documents.total}), 0)`,
        documentCount: sql<number>`COUNT(${schema.documents.id})`,
      })
      .from(schema.documents)
      .where(eq(schema.documents.clientId, clientId));

    const row = rows[0];
    return {
      totalInvoiced: Number(row?.totalInvoiced ?? 0),
      documentCount: Number(row?.documentCount ?? 0),
    };
  }
}

export const clientRepository = new ClientRepository();
