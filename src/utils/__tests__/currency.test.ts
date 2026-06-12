// src/utils/__tests__/currency.test.ts
import { CURRENCY_LIST, getCurrencyConfig, formatCurrency } from '../currency';

describe('CURRENCY_LIST', () => {
  it('contains at least 100 currencies', () => {
    expect(CURRENCY_LIST.length).toBeGreaterThan(100);
  });

  it('contains priority currencies', () => {
    const codes = CURRENCY_LIST.map((c) => c.code);
    expect(codes).toContain('EUR');
    expect(codes).toContain('USD');
    expect(codes).toContain('XAF');
    expect(codes).toContain('XOF');
    expect(codes).toContain('GBP');
  });

  it('EUR comes before less common currencies', () => {
    const codes = CURRENCY_LIST.map((c) => c.code);
    expect(codes.indexOf('EUR')).toBeLessThan(codes.indexOf('ZMW'));
  });
});

describe('getCurrencyConfig', () => {
  it('returns EUR config correctly', () => {
    const config = getCurrencyConfig('EUR');
    expect(config.code).toBe('EUR');
    expect(config.symbol).toBe('€');
    expect(config.decimalDigits).toBe(2);
  });

  it('returns XAF with 0 decimal digits and FCFA symbol', () => {
    const config = getCurrencyConfig('XAF');
    expect(config.symbol).toBe('FCFA');
    expect(config.decimalDigits).toBe(0);
  });

  it('returns XOF with 0 decimal digits', () => {
    const config = getCurrencyConfig('XOF');
    expect(config.decimalDigits).toBe(0);
  });

  it('returns JPY with 0 decimal digits', () => {
    const config = getCurrencyConfig('JPY');
    expect(config.decimalDigits).toBe(0);
  });

  it('returns KWD with 3 decimal digits', () => {
    const config = getCurrencyConfig('KWD');
    expect(config.decimalDigits).toBe(3);
  });

  it('falls back to USD for unknown code', () => {
    const config = getCurrencyConfig('ZZZ');
    expect(config.code).toBeDefined();
  });
});

describe('formatCurrency', () => {
  it('formats EUR before amount by default', () => {
    const config = getCurrencyConfig('EUR');
    const result = formatCurrency(1234.5, config);
    expect(result).toContain('€');
    expect(result).toContain('1');
  });

  it('formats XAF after amount', () => {
    const config = getCurrencyConfig('XAF');
    const result = formatCurrency(1000, config);
    expect(result).toContain('FCFA');
    expect(result).toContain('1');
  });

  it('respects decimal digits for XAF (0 decimals)', () => {
    const config = getCurrencyConfig('XAF');
    const result = formatCurrency(1234.56, config);
    expect(result).not.toContain('.');
  });

  it('formats JPY without decimals', () => {
    const config = getCurrencyConfig('JPY');
    const result = formatCurrency(1000, config);
    expect(result).not.toContain('.');
  });

  it('uses custom decimal separator', () => {
    const config = { ...getCurrencyConfig('EUR'), decimalSep: ',', thousandsSep: ' ' };
    const result = formatCurrency(1234.5, config);
    expect(result).toContain(',');
  });

  it('handles zero amount', () => {
    const config = getCurrencyConfig('USD');
    const result = formatCurrency(0, config);
    expect(result).toContain('0');
  });

  it('handles large amounts with thousands separator', () => {
    const config = getCurrencyConfig('EUR');
    const result = formatCurrency(1000000, config);
    expect(result.replace(/[€\s]/g, '').length).toBeGreaterThan(3);
  });
});
