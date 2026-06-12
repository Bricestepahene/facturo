// src/services/backup/BackupService.ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '@/db/client';
import * as schema from '@/db/schema';

interface BackupData {
  version: 1;
  exportedAt: string;
  clients: unknown[];
  products: unknown[];
  taxRates: unknown[];
  documents: unknown[];
  documentItems: unknown[];
  companySettings: unknown[];
  appUsage: unknown[];
}

export async function exportBackup(): Promise<void> {
  const [clients, products, taxRates, documents, documentItems, companySettings, appUsage] =
    await Promise.all([
      db.select().from(schema.clients),
      db.select().from(schema.products),
      db.select().from(schema.taxRates),
      db.select().from(schema.documents),
      db.select().from(schema.documentItems),
      db.select().from(schema.companySettings),
      db.select().from(schema.appUsage),
    ]);

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    clients,
    products,
    taxRates,
    documents,
    documentItems,
    companySettings,
    appUsage,
  };

  const json = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().split('T')[0];
  const filename = `facturo_backup_${date}.json`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing not available on this device');
  }
  await Sharing.shareAsync(uri, { mimeType: 'application/json', UTI: 'public.json' });
}

export async function importBackup(): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return;
  }

  const uri = result.assets[0].uri;
  const raw = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const backup = JSON.parse(raw) as BackupData;
  if (backup.version !== 1) {
    throw new Error('Unsupported backup version');
  }

  await db.transaction(async (tx) => {
    await tx.delete(schema.documentItems);
    await tx.delete(schema.documents);
    await tx.delete(schema.clients);
    await tx.delete(schema.products);
    await tx.delete(schema.taxRates);

    if (backup.clients?.length) {
      await tx.insert(schema.clients).values(backup.clients as typeof schema.clients.$inferInsert[]);
    }
    if (backup.products?.length) {
      await tx.insert(schema.products).values(backup.products as typeof schema.products.$inferInsert[]);
    }
    if (backup.taxRates?.length) {
      await tx.insert(schema.taxRates).values(backup.taxRates as typeof schema.taxRates.$inferInsert[]);
    }
    if (backup.documents?.length) {
      await tx.insert(schema.documents).values(backup.documents as typeof schema.documents.$inferInsert[]);
    }
    if (backup.documentItems?.length) {
      await tx.insert(schema.documentItems).values(backup.documentItems as typeof schema.documentItems.$inferInsert[]);
    }
    if (backup.companySettings?.length) {
      for (const row of backup.companySettings as typeof schema.companySettings.$inferInsert[]) {
        await tx
          .insert(schema.companySettings)
          .values(row)
          .onConflictDoUpdate({ target: schema.companySettings.id, set: row });
      }
    }
  });
}

export const BackupService = { exportBackup, importBackup };
