// src/utils/__tests__/calculations.test.ts
import { calculateLineItem, calculateDocument, roundForDisplay } from '../calculations';
import type { TaxRate, DocumentItem } from '@/types';

const TAX_20: TaxRate = {
  id: 'tax-20',
  name: 'TVA 20%',
  rate: 20,
  isDefault: true,
  isCompound: false,
  createdAt: '2024-01-01',
};

const TAX_10: TaxRate = {
  id: 'tax-10',
  name: 'TVA 10%',
  rate: 10,
  isDefault: false,
  isCompound: false,
  createdAt: '2024-01-01',
};

describe('calculateLineItem', () => {
  it('computes subtotal = quantity × unitPrice', () => {
    const result = calculateLineItem(3, 100, null, null, [], []);
    expect(result.subtotal).toBe(300);
  });

  it('applies percentage discount correctly', () => {
    const result = calculateLineItem(1, 100, 'percentage', 10, [], []);
    expect(result.discountAmount).toBe(10);
    expect(result.taxableAmount).toBe(90);
  });

  it('applies fixed discount correctly', () => {
    const result = calculateLineItem(2, 50, 'fixed', 20, [], []);
    expect(result.discountAmount).toBe(20);
    expect(result.taxableAmount).toBe(80);
  });

  it('computes tax on taxable amount', () => {
    const result = calculateLineItem(1, 100, null, null, [TAX_20], ['tax-20']);
    expect(result.taxAmount).toBe(20);
    expect(result.total).toBe(120);
  });

  it('sums multiple tax rates', () => {
    const result = calculateLineItem(1, 100, null, null, [TAX_20, TAX_10], ['tax-20', 'tax-10']);
    expect(result.taxAmount).toBe(30);
    expect(result.total).toBe(130);
  });

  it('ignores zero discount', () => {
    const result = calculateLineItem(1, 100, 'percentage', 0, [TAX_20], ['tax-20']);
    expect(result.discountAmount).toBe(0);
    expect(result.taxableAmount).toBe(100);
    expect(result.total).toBe(120);
  });

  it('handles null discount gracefully', () => {
    const result = calculateLineItem(2, 50, null, null, [], []);
    expect(result.discountAmount).toBe(0);
    expect(result.subtotal).toBe(100);
    expect(result.total).toBe(100);
  });

  it('total = taxable + tax when no discount', () => {
    const result = calculateLineItem(5, 200, null, null, [TAX_20], ['tax-20']);
    expect(result.subtotal).toBe(1000);
    expect(result.taxableAmount).toBe(1000);
    expect(result.taxAmount).toBe(200);
    expect(result.total).toBe(1200);
  });
});

describe('calculateDocument', () => {
  function makeItem(subtotal: number, taxableAmount: number, taxRateId: string): DocumentItem {
    return {
      id: `item-${Math.random()}`,
      documentId: 'doc-1',
      position: 0,
      productId: null,
      description: 'Test',
      quantity: 1,
      unitPrice: subtotal,
      unit: 'pcs',
      discountType: null,
      discountValue: null,
      appliedTaxRateIds: JSON.stringify([taxRateId]),
      subtotal,
      discountAmount: subtotal - taxableAmount,
      taxableAmount,
      taxAmount: 0,
      total: subtotal,
    };
  }

  it('sums item subtotals for doc subtotal', () => {
    const items = [makeItem(100, 100, 'tax-20'), makeItem(200, 200, 'tax-20')];
    const result = calculateDocument(items, null, null, [TAX_20]);
    expect(result.subtotal).toBe(300);
  });

  it('applies percentage global discount', () => {
    const items = [makeItem(100, 100, 'tax-20')];
    const result = calculateDocument(items, 'percentage', 10, [TAX_20]);
    expect(result.discountAmount).toBe(10);
    expect(result.taxableAmount).toBe(90);
  });

  it('applies fixed global discount', () => {
    const items = [makeItem(200, 200, 'tax-20')];
    const result = calculateDocument(items, 'fixed', 50, [TAX_20]);
    expect(result.discountAmount).toBe(50);
    expect(result.taxableAmount).toBe(150);
  });

  it('aggregates tax lines by rate', () => {
    const items = [
      makeItem(100, 100, 'tax-20'),
      makeItem(100, 100, 'tax-20'),
    ];
    const result = calculateDocument(items, null, null, [TAX_20]);
    expect(result.taxLines).toHaveLength(1);
    expect(result.taxLines[0].baseAmount).toBe(200);
    expect(result.taxLines[0].taxAmount).toBeCloseTo(40);
  });

  it('creates separate tax lines for different rates', () => {
    const items = [
      makeItem(100, 100, 'tax-20'),
      makeItem(100, 100, 'tax-10'),
    ];
    const result = calculateDocument(items, null, null, [TAX_20, TAX_10]);
    expect(result.taxLines).toHaveLength(2);
  });

  it('computes total correctly', () => {
    const items = [makeItem(100, 100, 'tax-20')];
    const result = calculateDocument(items, null, null, [TAX_20]);
    expect(result.total).toBe(120);
  });
});

describe('roundForDisplay', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundForDisplay(1.005, 2)).toBe(1.01);
    expect(roundForDisplay(1.004, 2)).toBe(1.00);
  });

  it('rounds to 0 decimal places (XAF/XOF)', () => {
    expect(roundForDisplay(1234.6, 0)).toBe(1235);
    expect(roundForDisplay(1234.4, 0)).toBe(1234);
  });

  it('rounds to 3 decimal places (KWD)', () => {
    expect(roundForDisplay(1.0005, 3)).toBe(1.001);
  });

  it('handles exact values without floating point drift', () => {
    expect(roundForDisplay(100, 2)).toBe(100);
    expect(roundForDisplay(0, 2)).toBe(0);
  });
});
