// src/services/pdf/PdfTemplate.tsx
// @react-pdf/renderer PDF template for Facturo invoices/quotes
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { CompanySettings, TaxRate } from '@/db/schema';
import type { DocumentWithItems } from '@/repositories/DocumentRepository';
import { roundForDisplay } from '@/utils/calculations';

// CurrencyConfig inline to avoid circular import
interface CurrencySnap {
  currencySymbol: string;
  currencySymbolPosition: string;
  currencyDecimalDigits: number;
  currencyThousandsSep: string;
  currencyDecimalSep: string;
}

function formatAmt(amount: number, snap: CurrencySnap): string {
  const digits = snap.currencyDecimalDigits;
  const rounded = roundForDisplay(amount, digits);
  const parts = rounded.toFixed(digits).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, snap.currencyThousandsSep);
  const formatted = digits > 0 ? `${intPart}${snap.currencyDecimalSep}${parts[1]}` : intPart;
  return snap.currencySymbolPosition === 'before'
    ? `${snap.currencySymbol} ${formatted}`
    : `${formatted} ${snap.currencySymbol}`;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 40, paddingVertical: 36, fontFamily: 'Helvetica', fontSize: 10, color: '#1E293B', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#1E40AF' },
  companyAddress: { fontSize: 9, color: '#64748B', marginTop: 4 },
  docTypeLabel: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', color: '#1E293B' },
  docNumber: { fontSize: 11, color: '#64748B', textAlign: 'right', marginTop: 4 },
  docDate: { fontSize: 9, color: '#64748B', textAlign: 'right', marginTop: 2 },
  clientSection: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 4, marginBottom: 20 },
  clientLabel: { fontSize: 8, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 },
  clientName: { fontSize: 11, fontWeight: 'bold', color: '#1E293B' },
  clientAddress: { fontSize: 9, color: '#64748B', marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1E40AF', paddingVertical: 6, paddingHorizontal: 4, borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 5, paddingHorizontal: 4 },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  descCol: { flex: 3 },
  numCol: { flex: 1, textAlign: 'right' },
  totalsSection: { alignItems: 'flex-end', marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { fontSize: 9, color: '#64748B', width: 140, textAlign: 'right', marginRight: 8 },
  totalValue: { fontSize: 9, width: 80, textAlign: 'right' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 2, borderTopColor: '#1E40AF', paddingTop: 4, marginTop: 4 },
  grandTotalLabel: { fontSize: 11, fontWeight: 'bold', color: '#1E293B', width: 140, textAlign: 'right', marginRight: 8 },
  grandTotalValue: { fontSize: 11, fontWeight: 'bold', color: '#1E40AF', width: 80, textAlign: 'right' },
  notes: { marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  notesLabel: { fontSize: 8, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 },
  notesText: { fontSize: 9, color: '#64748B' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 },
  footerText: { fontSize: 8, color: '#94A3B8', textAlign: 'center' },
  brandingFooter: { fontSize: 8, color: '#94A3B8', textAlign: 'center', marginTop: 2 },
  watermark: { position: 'absolute', top: '40%', left: '10%', right: '10%', opacity: 0.12 },
  watermarkText: { fontSize: 72, fontWeight: 'bold', color: '#EF4444', textAlign: 'center', transform: [{ rotate: '-35deg' }] },
  logo: { width: 60, height: 60, objectFit: 'contain' },
});

interface PdfProps {
  document: DocumentWithItems;
  company: CompanySettings;
  taxRates: TaxRate[];
  isPro: boolean;
}

export function InvoicePdf({ document: doc, company, taxRates, isPro }: PdfProps) {
  const locale = doc.language ?? 'fr';
  const isInvoice = doc.type === 'invoice';
  const snap: CurrencySnap = {
    currencySymbol: doc.currencySymbol,
    currencySymbolPosition: doc.currencySymbolPosition,
    currencyDecimalDigits: doc.currencyDecimalDigits,
    currencyThousandsSep: doc.currencyThousandsSep,
    currencyDecimalSep: doc.currencyDecimalSep,
  };

  let clientData: { name?: string; addressLine1?: string; city?: string; countryCode?: string; taxId?: string } = {};
  try {
    if (doc.clientSnapshot) clientData = JSON.parse(doc.clientSnapshot);
  } catch { /* ignore */ }

  const labels = locale === 'fr' ? {
    invoice: 'FACTURE', quote: 'DEVIS', billTo: 'Facturé à',
    from: 'Émetteur', desc: 'Désignation', qty: 'Qté', unitPrice: 'P.U.', unit: 'Unité', amount: 'Montant',
    subtotal: 'Sous-total HT', discount: 'Remise', taxable: 'Base TVA', total: 'Total TTC',
    notes: 'Notes', terms: 'Conditions de paiement', page: 'Page', draft: 'BROUILLON',
    issueDate: "Date d'émission", dueDate: "Date d'échéance", docNumber: 'Numéro',
  } : {
    invoice: 'INVOICE', quote: 'QUOTE', billTo: 'Billed to',
    from: 'From', desc: 'Description', qty: 'Qty', unitPrice: 'Unit Price', unit: 'Unit', amount: 'Amount',
    subtotal: 'Subtotal', discount: 'Discount', taxable: 'Taxable Amount', total: 'Total',
    notes: 'Notes', terms: 'Payment terms', page: 'Page', draft: 'DRAFT',
    issueDate: 'Issue date', dueDate: 'Due date', docNumber: 'Number',
  };

  return (
    <Document title={`${isInvoice ? labels.invoice : labels.quote} ${doc.number ?? ''}`} author={company.name}>
      <Page size="A4" style={styles.page}>
        {/* Watermark for drafts */}
        {doc.status === 'draft' && (
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>{labels.draft}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            {company.logoUri && <Image src={company.logoUri} style={styles.logo} />}
            <Text style={styles.companyName}>{company.name}</Text>
            {company.addressLine1 && <Text style={styles.companyAddress}>{company.addressLine1}</Text>}
            {(company.city || company.countryCode) && (
              <Text style={styles.companyAddress}>{[company.city, company.countryCode].filter(Boolean).join(', ')}</Text>
            )}
            {company.email && <Text style={styles.companyAddress}>{company.email}</Text>}
            {company.phone && <Text style={styles.companyAddress}>{company.phone}</Text>}
            {company.taxId && <Text style={styles.companyAddress}>TVA: {company.taxId}</Text>}
          </View>
          <View>
            <Text style={styles.docTypeLabel}>{isInvoice ? labels.invoice : labels.quote}</Text>
            <Text style={styles.docNumber}>{labels.docNumber}: {doc.number}</Text>
            <Text style={styles.docDate}>{labels.issueDate}: {doc.date}</Text>
            {doc.dueDate && <Text style={styles.docDate}>{labels.dueDate}: {doc.dueDate}</Text>}
          </View>
        </View>

        {/* Client block */}
        <View style={styles.clientSection}>
          <Text style={styles.clientLabel}>{labels.billTo}</Text>
          <Text style={styles.clientName}>{clientData.name ?? ''}</Text>
          {clientData.addressLine1 && <Text style={styles.clientAddress}>{clientData.addressLine1}</Text>}
          {(clientData.city || clientData.countryCode) && (
            <Text style={styles.clientAddress}>{[clientData.city, clientData.countryCode].filter(Boolean).join(', ')}</Text>
          )}
          {clientData.taxId && <Text style={styles.clientAddress}>TVA: {clientData.taxId}</Text>}
        </View>

        {/* Items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.descCol]}>{labels.desc}</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>{labels.qty}</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>{labels.unitPrice}</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>{labels.amount}</Text>
        </View>
        {doc.items.map((item, idx) => (
          <View key={item.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={styles.descCol}>{item.description}</Text>
            <Text style={[{ textAlign: 'right' }, styles.numCol]}>{item.quantity}</Text>
            <Text style={[{ textAlign: 'right' }, styles.numCol]}>{formatAmt(item.unitPrice, snap)}</Text>
            <Text style={[{ textAlign: 'right' }, styles.numCol]}>{formatAmt(item.total, snap)}</Text>
          </View>
        ))}

        {/* Financial summary */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{labels.subtotal}</Text>
            <Text style={styles.totalValue}>{formatAmt(doc.subtotal, snap)}</Text>
          </View>
          {doc.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{labels.discount}</Text>
              <Text style={styles.totalValue}>- {formatAmt(doc.discountAmount, snap)}</Text>
            </View>
          )}
          {/* Tax lines */}
          {taxRates
            .filter(tr => doc.items.some(i => {
              try { return (JSON.parse(i.appliedTaxRateIds) as string[]).includes(tr.id); }
              catch { return false; }
            }))
            .map(tr => {
              const taxLineAmount = doc.items.reduce((sum, item) => {
                try {
                  const ids = JSON.parse(item.appliedTaxRateIds) as string[];
                  if (!ids.includes(tr.id)) return sum;
                  return sum + (tr.rate / 100) * item.taxableAmount;
                } catch { return sum; }
              }, 0);
              return (
                <View key={tr.id} style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{tr.name} ({tr.rate}%)</Text>
                  <Text style={styles.totalValue}>{formatAmt(taxLineAmount, snap)}</Text>
                </View>
              );
            })
          }
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{labels.total}</Text>
            <Text style={styles.grandTotalValue}>{formatAmt(doc.total, snap)}</Text>
          </View>
        </View>

        {/* Notes & Terms */}
        {(doc.notes || doc.terms) && (
          <View style={styles.notes}>
            {doc.notes && (
              <>
                <Text style={styles.notesLabel}>{labels.notes}</Text>
                <Text style={styles.notesText}>{doc.notes}</Text>
              </>
            )}
            {doc.terms && (
              <>
                <Text style={[styles.notesLabel, { marginTop: 8 }]}>{labels.terms}</Text>
                <Text style={styles.notesText}>{doc.terms}</Text>
              </>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          {company.legalMentions && <Text style={styles.footerText}>{company.legalMentions}</Text>}
          {company.bankDetails && <Text style={styles.footerText}>{company.bankDetails}</Text>}
          {!isPro && <Text style={styles.brandingFooter}>Créé avec Facturo — facturo.app</Text>}
        </View>
      </Page>
    </Document>
  );
}
