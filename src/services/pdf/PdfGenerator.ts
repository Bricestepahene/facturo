// src/services/pdf/PdfGenerator.ts
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import * as FileSystem from 'expo-file-system';
import type { CompanySettings, TaxRate } from '@/db/schema';
import type { DocumentWithItems } from '@/types';
import { taxRateRepository } from '@/repositories/TaxRateRepository';
import { InvoicePdf } from './PdfTemplate';

export async function generatePdf(
  document: DocumentWithItems,
  company: CompanySettings,
  isPro: boolean,
): Promise<string> {
  const taxRates: TaxRate[] = await taxRateRepository.findAll();

  const element = React.createElement(InvoicePdf, {
    document,
    company,
    taxRates,
    isPro,
  });

  const pdfInstance = pdf(element);
  const blob: Blob = await pdfInstance.toBlob();

  // Convert Blob to base64
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  uint8Array.forEach(byte => { binary += String.fromCharCode(byte); });
  const base64 = btoa(binary);

  // Save to cache directory
  const safeNumber = (document.number ?? 'doc').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `facturo_${safeNumber}.pdf`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return uri;
}
