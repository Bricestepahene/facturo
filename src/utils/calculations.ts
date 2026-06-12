// src/utils/calculations.ts

import type { TaxRate, DocumentItem, LineItemCalculation, DocumentCalculation, TaxLine } from '@/types';

/**
 * Calculate all financial values for a single line item.
 * No rounding is performed — rounding happens only at display time.
 *
 * Formula:
 *   subtotal    = quantity × unitPrice
 *   discount    = (type='percentage') ? subtotal × (val/100) : val
 *   taxable     = subtotal - discount
 *   taxAmount   = Σ (rate/100 × taxable) for each applied tax
 *   total       = taxable + taxAmount
 */
export function calculateLineItem(
  quantity: number,
  unitPrice: number,
  discountType: 'percentage' | 'fixed' | null | undefined,
  discountValue: number | null | undefined,
  taxRates: TaxRate[],
  appliedTaxRateIds: string[],
): LineItemCalculation {
  const subtotal = quantity * unitPrice;

  let discountAmount = 0;
  if (discountType != null && discountValue != null && discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
  }

  const taxableAmount = subtotal - discountAmount;

  const applicableTaxRates = taxRates.filter((tr) => appliedTaxRateIds.includes(tr.id));
  let taxAmount = 0;
  for (const tr of applicableTaxRates) {
    taxAmount += (tr.rate / 100) * taxableAmount;
  }

  const total = taxableAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
  };
}

/**
 * Calculate all financial values for a complete document.
 * Aggregates tax lines by taxRateId across all items.
 * No rounding is performed — rounding happens only at display time.
 *
 * Formula:
 *   docSubtotal  = Σ(item.subtotal)
 *   docDiscount  = (type='percentage') ? docSubtotal × (val/100) : val
 *   docTaxable   = docSubtotal - docDiscount
 *   taxLines     = grouped by taxRateId, proportional bases from docTaxable
 *   docTaxTotal  = Σ(taxLine.taxAmount)
 *   docTotal     = docTaxable + docTaxTotal
 */
export function calculateDocument(
  items: DocumentItem[],
  globalDiscountType: 'percentage' | 'fixed' | null | undefined,
  globalDiscountValue: number | null | undefined,
  taxRates: TaxRate[],
): DocumentCalculation {
  // Step 1: sum raw item subtotals (quantity × unitPrice, no item-level discounts here)
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

  // Step 2: global discount on docSubtotal
  let discountAmount = 0;
  if (globalDiscountType != null && globalDiscountValue != null && globalDiscountValue > 0) {
    if (globalDiscountType === 'percentage') {
      discountAmount = subtotal * (globalDiscountValue / 100);
    } else {
      discountAmount = globalDiscountValue;
    }
  }

  const taxableAmount = subtotal - discountAmount;

  // Step 3: aggregate tax lines from all items
  // We need the total item-level taxableAmount to compute the global discount ratio
  const totalItemTaxable = items.reduce((acc, item) => acc + item.taxableAmount, 0);

  // discount ratio applied proportionally to each item's taxable base
  const discountRatio = totalItemTaxable > 0 ? taxableAmount / totalItemTaxable : 1;

  const taxLineMap = new Map<string, TaxLine>();

  for (const item of items) {
    let appliedIds: string[] = [];
    try {
      appliedIds = JSON.parse(item.appliedTaxRateIds) as string[];
    } catch {
      appliedIds = [];
    }

    for (const taxRateId of appliedIds) {
      const taxRate = taxRates.find((tr) => tr.id === taxRateId);
      if (!taxRate) continue;

      // Scale the item taxable base by the global discount ratio
      const adjustedBase = item.taxableAmount * discountRatio;
      const lineTaxAmount = (taxRate.rate / 100) * adjustedBase;

      const existing = taxLineMap.get(taxRateId);
      if (existing) {
        existing.baseAmount += adjustedBase;
        existing.taxAmount += lineTaxAmount;
      } else {
        taxLineMap.set(taxRateId, {
          taxRateId,
          name: taxRate.name,
          rate: taxRate.rate,
          baseAmount: adjustedBase,
          taxAmount: lineTaxAmount,
        });
      }
    }
  }

  const taxLines = Array.from(taxLineMap.values());
  const taxTotal = taxLines.reduce((acc, tl) => acc + tl.taxAmount, 0);
  const total = taxableAmount + taxTotal;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount: taxTotal,
    total,
    taxLines,
  };
}

/**
 * The ONLY rounding function used in Facturo.
 * Call this exclusively when formatting for display or storing final values in DB.
 */
export function roundForDisplay(value: number, decimalDigits: number): number {
  const factor = Math.pow(10, decimalDigits);
  return Math.round(value * factor) / factor;
}
