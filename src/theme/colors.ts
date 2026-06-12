// src/theme/colors.ts

export const COLORS = {
  // ── Primary — Blue ─────────────────────────────────────────────────────────
  Primary:       '#1E40AF',
  PrimaryLight:  '#3B82F6',
  PrimaryDark:   '#1E3A8A',

  // ── Secondary — Green ──────────────────────────────────────────────────────
  Secondary:      '#10B981',
  SecondaryLight: '#34D399',
  SecondaryDark:  '#059669',

  // ── Semantic ───────────────────────────────────────────────────────────────
  Error:   '#EF4444',
  Warning: '#F59E0B',
  Success: '#10B981',
  Info:    '#3B82F6',

  // ── Backgrounds & Surfaces ─────────────────────────────────────────────────
  Background:     '#F8FAFC',
  Surface:        '#FFFFFF',
  SurfaceVariant: '#F1F5F9',

  // ── Text ───────────────────────────────────────────────────────────────────
  TextPrimary:   '#1E293B',
  TextSecondary: '#64748B',
  TextDisabled:  '#94A3B8',

  // ── Borders ────────────────────────────────────────────────────────────────
  Border:      '#E2E8F0',
  BorderFocus: '#1E40AF',
  Divider:     '#F1F5F9',

  // ── Document status colors ─────────────────────────────────────────────────
  StatusDraft:     '#94A3B8',
  StatusSent:      '#3B82F6',
  StatusPaid:      '#10B981',
  StatusOverdue:   '#EF4444',
  StatusCancelled: '#6B7280',
  StatusConverted: '#8B5CF6',

  // ── Misc ───────────────────────────────────────────────────────────────────
  Overlay: 'rgba(0,0,0,0.5)',
  Shadow:  'rgba(0,0,0,0.1)',

  // ── Monetization ───────────────────────────────────────────────────────────
  AdBackground: '#FFF7ED',
} as const;

export type ColorKey = keyof typeof COLORS;
