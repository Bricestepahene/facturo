// src/repositories/SettingsRepository.ts

import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { getMonthKey } from '@/utils/dateUtils';
import type { CompanySettings, AppUsage } from '@/types';

const DEFAULT_COMPANY: typeof schema.companySettings.$inferInsert = {
  id: 'singleton',
  name: '',
  defaultCurrencyCode: 'EUR',
  defaultLanguage: 'fr',
  invoicePrefix: 'FAC',
  invoiceCounter: 0,
  quotePrefix: 'DEV',
  quoteCounter: 0,
  defaultPaymentTermsDays: 30,
  countryCode: 'FR',
};

const DEFAULT_USAGE: typeof schema.appUsage.$inferInsert = {
  id: 'singleton',
  pdfCountThisMonth: 0,
  lastResetMonth: '',
  isPro: false,
  hasSeenOnboarding: false,
};

export class SettingsRepository {
  async getCompanySettings(): Promise<CompanySettings> {
    const rows = await db
      .select()
      .from(schema.companySettings)
      .where(eq(schema.companySettings.id, 'singleton'));
    if (rows[0]) return rows[0];
    await db.insert(schema.companySettings).values(DEFAULT_COMPANY);
    return (
      await db
        .select()
        .from(schema.companySettings)
        .where(eq(schema.companySettings.id, 'singleton'))
    )[0];
  }

  async updateCompanySettings(
    data: Partial<CompanySettings>,
  ): Promise<CompanySettings> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = data;
    await db
      .update(schema.companySettings)
      .set(rest)
      .where(eq(schema.companySettings.id, 'singleton'));
    return this.getCompanySettings();
  }

  async getAppUsage(): Promise<AppUsage> {
    const rows = await db
      .select()
      .from(schema.appUsage)
      .where(eq(schema.appUsage.id, 'singleton'));
    if (rows[0]) return rows[0];
    await db.insert(schema.appUsage).values(DEFAULT_USAGE);
    return (
      await db
        .select()
        .from(schema.appUsage)
        .where(eq(schema.appUsage.id, 'singleton'))
    )[0];
  }

  async updateAppUsage(data: Partial<AppUsage>): Promise<AppUsage> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = data;
    await db
      .update(schema.appUsage)
      .set(rest)
      .where(eq(schema.appUsage.id, 'singleton'));
    return this.getAppUsage();
  }

  async incrementPdfCount(): Promise<AppUsage> {
    const current = await this.getAppUsage();
    return this.updateAppUsage({
      pdfCountThisMonth: current.pdfCountThisMonth + 1,
    });
  }

  async resetMonthlyCount(): Promise<void> {
    await this.updateAppUsage({
      pdfCountThisMonth: 0,
      lastResetMonth: getMonthKey(),
    });
  }

  async checkAndResetMonthlyCount(): Promise<AppUsage> {
    const usage = await this.getAppUsage();
    const currentMonth = getMonthKey();
    if (usage.lastResetMonth !== currentMonth) {
      return this.updateAppUsage({
        pdfCountThisMonth: 0,
        lastResetMonth: currentMonth,
      });
    }
    return usage;
  }
}

export const settingsRepository = new SettingsRepository();
