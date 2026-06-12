// src/services/pdf/PdfSharing.ts
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Linking } from 'react-native';

export async function sharePdf(uri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

export async function downloadPdf(uri: string, filename: string): Promise<string> {
  const destUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: destUri });
  return destUri;
}

export async function printPdf(uri: string): Promise<void> {
  await Print.printAsync({ uri });
}

export async function shareViaWhatsApp(uri: string): Promise<void> {
  // WhatsApp doesn't support direct file sharing via URL scheme on Android
  // Use expo-sharing which presents the app picker including WhatsApp
  await sharePdf(uri);
}

export const PdfSharing = { sharePdf, downloadPdf, printPdf, shareViaWhatsApp };
