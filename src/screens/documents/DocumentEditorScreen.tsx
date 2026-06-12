// src/screens/documents/DocumentEditorScreen.tsx
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RootStackScreenProps } from '@/navigation/types';
import { useTranslation } from '@/i18n/index';
import { documentRepository } from '@/repositories/DocumentRepository';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { taxRateRepository } from '@/repositories/TaxRateRepository';
import {
  calculateLineItem,
  calculateDocument,
  roundForDisplay,
} from '@/utils/calculations';
import { formatCurrency, getCurrencyConfig, CURRENCY_LIST } from '@/utils/currency';
import { today, addDays } from '@/utils/dateUtils';
import { generateId } from '@/utils/documentNumber';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import type {
  TaxRate,
  DocumentItem,
  DocumentWithItems,
  CompanySettings,
} from '@/types';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

type Props = RootStackScreenProps<'DocumentEditor'>;

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  id: z.string(),
  productId: z.string().nullable().optional(),
  description: z.string().min(1),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  unit: z.string().default('pcs'),
  discountType: z.enum(['percentage', 'fixed']).nullable().optional(),
  discountValue: z.number().nullable().optional(),
  appliedTaxRateIds: z.array(z.string()).default([]),
  // Calculated
  subtotal: z.number().default(0),
  discountAmount: z.number().default(0),
  taxableAmount: z.number().default(0),
  taxAmount: z.number().default(0),
  total: z.number().default(0),
});

const editorSchema = z.object({
  type: z.enum(['invoice', 'quote']),
  clientId: z.string().nullable().optional(),
  clientSnapshot: z.string().min(1),
  date: z.string().min(1),
  dueDate: z.string().nullable().optional(),
  language: z.enum(['fr', 'en']).default('fr'),
  currencyCode: z.string().min(3),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  globalDiscountType: z.enum(['percentage', 'fixed']).nullable().optional(),
  globalDiscountValue: z.number().nullable().optional(),
  items: z.array(lineItemSchema).min(1),
});

type EditorFormData = z.infer<typeof editorSchema>;
type LineItemFormData = z.infer<typeof lineItemSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEmptyItem(): LineItemFormData {
  return {
    id: '__new__',
    description: '',
    quantity: 1,
    unitPrice: 0,
    unit: 'pcs',
    discountType: null,
    discountValue: null,
    appliedTaxRateIds: [],
    subtotal: 0,
    discountAmount: 0,
    taxableAmount: 0,
    taxAmount: 0,
    total: 0,
  };
}

function docItemToFormItem(item: DocumentItem): LineItemFormData {
  let taxIds: string[] = [];
  try {
    taxIds = JSON.parse(item.appliedTaxRateIds) as string[];
  } catch {
    taxIds = [];
  }
  return {
    id: item.id,
    productId: item.productId ?? null,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    unit: item.unit,
    discountType: item.discountType ?? null,
    discountValue: item.discountValue ?? null,
    appliedTaxRateIds: taxIds,
    subtotal: item.subtotal,
    discountAmount: item.discountAmount,
    taxableAmount: item.taxableAmount,
    taxAmount: item.taxAmount,
    total: item.total,
  };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DocumentEditorScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { documentId, type: routeType } = route.params ?? {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [existingDoc, setExistingDoc] = useState<DocumentWithItems | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [convertConfirmVisible, setConvertConfirmVisible] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Auto-save timer
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedDocumentId = useRef<string | null>(documentId ?? null);

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditorFormData>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      type: routeType ?? 'invoice',
      clientId: null,
      clientSnapshot: '{}',
      date: today(),
      dueDate: null,
      language: 'fr',
      currencyCode: 'EUR',
      notes: null,
      terms: null,
      globalDiscountType: null,
      globalDiscountValue: null,
      items: [buildEmptyItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedCurrencyCode = watch('currencyCode');
  const watchedType = watch('type');
  const watchedGlobalDiscountType = watch('globalDiscountType');
  const watchedGlobalDiscountValue = watch('globalDiscountValue');
  const watchedLanguage = watch('language');

  const currencyConfig = useMemo(
    () => getCurrencyConfig(watchedCurrencyCode),
    [watchedCurrencyCode],
  );

  // ---------------------------------------------------------------------------
  // Load on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [rates, settings] = await Promise.all([
          taxRateRepository.findAll(),
          settingsRepository.getCompanySettings(),
        ]);
        setTaxRates(rates);
        setCompanySettings(settings);

        if (documentId) {
          const doc = await documentRepository.findWithItems(documentId);
          if (doc) {
            setExistingDoc(doc);
            let taxIds: string[] = [];
            try {
              taxIds = JSON.parse(doc.items[0]?.appliedTaxRateIds ?? '[]') as string[];
            } catch {
              taxIds = [];
            }
            reset({
              type: doc.type,
              clientId: doc.clientId ?? null,
              clientSnapshot: doc.clientSnapshot,
              date: doc.date,
              dueDate: doc.dueDate ?? null,
              language: doc.language,
              currencyCode: doc.currencyCode,
              notes: doc.notes ?? null,
              terms: doc.terms ?? null,
              globalDiscountType: doc.globalDiscountType ?? null,
              globalDiscountValue: doc.globalDiscountValue ?? null,
              items:
                doc.items.length > 0
                  ? doc.items.map(docItemToFormItem)
                  : [buildEmptyItem()],
            });
          }
        } else {
          // Initialize with company defaults
          const paymentDays = settings.defaultPaymentTermsDays ?? 30;
          reset((prev) => ({
            ...prev,
            type: routeType ?? 'invoice',
            currencyCode: settings.defaultCurrencyCode,
            language: settings.defaultLanguage as 'fr' | 'en',
            date: today(),
            dueDate:
              (routeType ?? 'invoice') === 'invoice'
                ? addDays(today(), paymentDays)
                : null,
          }));
        }
      } catch {
        Alert.alert(t('common:error'), t('common:unexpectedError'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // ---------------------------------------------------------------------------
  // Real-time calculations
  // ---------------------------------------------------------------------------
  const recalculateItem = useCallback(
    (index: number) => {
      const item = watchedItems[index];
      if (!item) return;
      const calc = calculateLineItem(
        item.quantity,
        item.unitPrice,
        item.discountType,
        item.discountValue,
        taxRates,
        item.appliedTaxRateIds,
      );
      setValue(`items.${index}.subtotal`, calc.subtotal, { shouldDirty: false });
      setValue(`items.${index}.discountAmount`, calc.discountAmount, { shouldDirty: false });
      setValue(`items.${index}.taxableAmount`, calc.taxableAmount, { shouldDirty: false });
      setValue(`items.${index}.taxAmount`, calc.taxAmount, { shouldDirty: false });
      setValue(`items.${index}.total`, calc.total, { shouldDirty: false });
    },
    [watchedItems, taxRates, setValue],
  );

  // Compute document totals from current items
  const docCalc = useMemo(() => {
    const fakeItems = watchedItems.map((item) => ({
      ...item,
      id: item.id,
      documentId: '',
      position: 0,
      productId: item.productId ?? null,
      discountType: item.discountType ?? null,
      discountValue: item.discountValue ?? null,
      appliedTaxRateIds: JSON.stringify(item.appliedTaxRateIds),
    }));
    return calculateDocument(
      fakeItems,
      watchedGlobalDiscountType,
      watchedGlobalDiscountValue,
      taxRates,
    );
  }, [watchedItems, watchedGlobalDiscountType, watchedGlobalDiscountValue, taxRates]);

  // ---------------------------------------------------------------------------
  // Auto-save
  // ---------------------------------------------------------------------------
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      // Fire-and-forget silent draft save
      handleSubmit(async (data) => {
        try {
          await performSave(data, true);
        } catch {
          // silent
        }
      })();
    }, 10000);
  }, [handleSubmit]); // performSave used via ref below

  useEffect(() => {
    if (isDirty) {
      scheduleAutoSave();
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [isDirty, scheduleAutoSave]);

  // ---------------------------------------------------------------------------
  // Save logic
  // ---------------------------------------------------------------------------
  const performSave = useCallback(
    async (data: EditorFormData, isDraftAutoSave: boolean = false): Promise<string> => {
      const cfg = getCurrencyConfig(data.currencyCode);
      const calc = calculateDocument(
        data.items.map((item) => ({
          ...item,
          id: item.id,
          documentId: '',
          position: 0,
          productId: item.productId ?? null,
          discountType: item.discountType ?? null,
          discountValue: item.discountValue ?? null,
          appliedTaxRateIds: JSON.stringify(item.appliedTaxRateIds),
        })),
        data.globalDiscountType,
        data.globalDiscountValue,
        taxRates,
      );

      const docPayload = {
        type: data.type,
        clientId: data.clientId ?? null,
        clientSnapshot: data.clientSnapshot,
        date: data.date,
        dueDate: data.dueDate ?? null,
        language: data.language,
        currencyCode: data.currencyCode,
        currencySymbol: cfg.symbol,
        currencySymbolPosition: cfg.symbolPosition,
        currencyDecimalDigits: cfg.decimalDigits,
        currencyThousandsSep: cfg.thousandsSep,
        currencyDecimalSep: cfg.decimalSep,
        globalDiscountType: data.globalDiscountType ?? null,
        globalDiscountValue: data.globalDiscountValue ?? null,
        subtotal: roundForDisplay(calc.subtotal, cfg.decimalDigits),
        discountAmount: roundForDisplay(calc.discountAmount, cfg.decimalDigits),
        taxableAmount: roundForDisplay(calc.taxableAmount, cfg.decimalDigits),
        taxTotal: roundForDisplay(calc.taxAmount, cfg.decimalDigits),
        total: roundForDisplay(calc.total, cfg.decimalDigits),
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        items: data.items.map((item, position) => {
          const itemCalc = calculateLineItem(
            item.quantity,
            item.unitPrice,
            item.discountType,
            item.discountValue,
            taxRates,
            item.appliedTaxRateIds,
          );
          return {
            position,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit,
            discountType: item.discountType ?? null,
            discountValue: item.discountValue ?? null,
            appliedTaxRateIds: JSON.stringify(item.appliedTaxRateIds),
            subtotal: roundForDisplay(itemCalc.subtotal, cfg.decimalDigits),
            discountAmount: roundForDisplay(itemCalc.discountAmount, cfg.decimalDigits),
            taxableAmount: roundForDisplay(itemCalc.taxableAmount, cfg.decimalDigits),
            taxAmount: roundForDisplay(itemCalc.taxAmount, cfg.decimalDigits),
            total: roundForDisplay(itemCalc.total, cfg.decimalDigits),
            productId: item.productId ?? null,
          };
        }),
      };

      if (savedDocumentId.current) {
        await documentRepository.update(savedDocumentId.current, docPayload);
        return savedDocumentId.current;
      } else {
        const created = await documentRepository.create(docPayload);
        savedDocumentId.current = created.id;
        return created.id;
      }
    },
    [taxRates],
  );

  const handleSave = useCallback(
    async (data: EditorFormData) => {
      setSaving(true);
      try {
        await performSave(data);
        navigation.goBack();
      } catch {
        Alert.alert(t('common:error'), t('common:unexpectedError'));
      } finally {
        setSaving(false);
      }
    },
    [performSave, navigation, t],
  );

  const handlePreviewPdf = useCallback(
    async (data: EditorFormData) => {
      setSaving(true);
      try {
        const savedId = await performSave(data);
        navigation.navigate('PdfPreview', { documentId: savedId });
      } catch {
        Alert.alert(t('common:error'), t('common:unexpectedError'));
      } finally {
        setSaving(false);
      }
    },
    [performSave, navigation, t],
  );

  const handleConvertToInvoice = useCallback(async () => {
    if (!savedDocumentId.current) return;
    setConvertConfirmVisible(false);
    setConverting(true);
    try {
      const newInvoice = await documentRepository.convertQuoteToInvoice(
        savedDocumentId.current,
      );
      navigation.replace('DocumentEditor', { documentId: newInvoice.id });
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setConverting(false);
    }
  }, [navigation, t]);

  const handleAddItem = useCallback(() => {
    append(buildEmptyItem());
  }, [append]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      if (fields.length > 1) {
        remove(index);
      }
    },
    [fields.length, remove],
  );

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderLineItem = (field: LineItemFormData & { id: string }, index: number) => (
    <View key={field.id} style={styles.lineItemContainer}>
      <View style={styles.lineItemHeader}>
        <Text style={styles.lineItemLabel}>
          {t('document:items')} #{index + 1}
        </Text>
        {fields.length > 1 && (
          <TouchableOpacity
            onPress={() => handleRemoveItem(index)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeItemText}>{t('document:removeItem')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      <Controller
        control={control}
        name={`items.${index}.description`}
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('common:description')}
            placeholder={t('common:description')}
            value={value}
            onChangeText={(text) => {
              onChange(text);
              scheduleAutoSave();
            }}
            error={errors.items?.[index]?.description ? t('common:fieldRequired') : undefined}
            multiline
            numberOfLines={2}
            returnKeyType="next"
          />
        )}
      />

      {/* Quantity & Unit Price */}
      <View style={styles.row2}>
        <View style={styles.halfField}>
          <Controller
            control={control}
            name={`items.${index}.quantity`}
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('document:quantity')}
                value={String(value)}
                onChangeText={(text) => {
                  const parsed = parseFloat(text.replace(',', '.'));
                  onChange(isNaN(parsed) ? 0 : parsed);
                  recalculateItem(index);
                  scheduleAutoSave();
                }}
                keyboardType="numeric"
                returnKeyType="next"
              />
            )}
          />
        </View>
        <View style={styles.halfField}>
          <Controller
            control={control}
            name={`items.${index}.unitPrice`}
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('document:unitPrice')}
                value={String(value)}
                onChangeText={(text) => {
                  const parsed = parseFloat(text.replace(',', '.'));
                  onChange(isNaN(parsed) ? 0 : parsed);
                  recalculateItem(index);
                  scheduleAutoSave();
                }}
                keyboardType="numeric"
                returnKeyType="next"
              />
            )}
          />
        </View>
      </View>

      {/* Unit */}
      <Controller
        control={control}
        name={`items.${index}.unit`}
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('document:unit')}
            value={value}
            onChangeText={onChange}
            returnKeyType="next"
          />
        )}
      />

      {/* Tax Rates */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t('document:taxRate')}</Text>
        <View style={styles.taxRatesRow}>
          {taxRates.map((rate) => {
            const applied = watchedItems[index]?.appliedTaxRateIds?.includes(rate.id);
            return (
              <TouchableOpacity
                key={rate.id}
                style={[styles.taxChip, applied && styles.taxChipActive]}
                onPress={() => {
                  const current = watchedItems[index]?.appliedTaxRateIds ?? [];
                  const updated = applied
                    ? current.filter((id) => id !== rate.id)
                    : [...current, rate.id];
                  setValue(`items.${index}.appliedTaxRateIds`, updated);
                  recalculateItem(index);
                  scheduleAutoSave();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.taxChipText, applied && styles.taxChipTextActive]}>
                  {rate.name} {rate.rate}%
                </Text>
              </TouchableOpacity>
            );
          })}
          {taxRates.length === 0 && (
            <Text style={styles.noTaxText}>{t('settings:noTaxRates')}</Text>
          )}
        </View>
      </View>

      {/* Item total */}
      <View style={styles.itemTotalRow}>
        <Text style={styles.itemTotalLabel}>{t('common:total')}</Text>
        <Text style={styles.itemTotalValue}>
          {formatCurrency(watchedItems[index]?.total ?? 0, currencyConfig)}
        </Text>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.Primary} />
        <Text style={styles.loadingText}>{t('common:loading')}</Text>
      </View>
    );
  }

  const isQuote = watchedType === 'quote';
  const isConverted = existingDoc?.status === 'converted';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.headerButtonText}>{t('common:cancel')}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {documentId
            ? isQuote
              ? t('document:editQuote')
              : t('document:editInvoice')
            : isQuote
            ? t('document:createQuote')
            : t('document:createInvoice')}
        </Text>

        <View style={styles.headerRightButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSubmit(handlePreviewPdf)}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.headerButtonText}>{t('document:preview')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerButtonPrimary]}
            onPress={handleSubmit(handleSave)}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.headerButtonPrimaryText}>✓</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Document Type Toggle */}
        <Card style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('document:type.invoice')}</Text>
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                watchedType === 'invoice' && styles.typeOptionActive,
              ]}
              onPress={() => {
                setValue('type', 'invoice');
                scheduleAutoSave();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.typeOptionIcon}>📄</Text>
              <Text
                style={[
                  styles.typeOptionText,
                  watchedType === 'invoice' && styles.typeOptionTextActive,
                ]}
              >
                {t('document:invoice')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeOption,
                watchedType === 'quote' && styles.typeOptionActive,
              ]}
              onPress={() => {
                setValue('type', 'quote');
                scheduleAutoSave();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.typeOptionIcon}>📋</Text>
              <Text
                style={[
                  styles.typeOptionText,
                  watchedType === 'quote' && styles.typeOptionTextActive,
                ]}
              >
                {t('document:quote')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Client Section */}
        <Card style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('document:client')}</Text>
          <Controller
            control={control}
            name="clientSnapshot"
            render={({ field: { value } }) => {
              let clientName = t('document:noClient');
              try {
                const parsed = JSON.parse(value) as { name?: string };
                if (parsed.name) clientName = parsed.name;
              } catch {
                // empty
              }
              return (
                <TouchableOpacity
                  style={[
                    styles.clientPickerButton,
                    errors.clientSnapshot && styles.clientPickerButtonError,
                  ]}
                  onPress={() => {
                    // ClientPicker navigation would go here
                    // For now shows the current client or prompt to navigate to client list
                    Alert.alert(
                      t('document:selectClient'),
                      t('document:selectClient'),
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.clientPickerText,
                      value === '{}' && styles.clientPickerPlaceholder,
                    ]}
                  >
                    {clientName}
                  </Text>
                  <Text style={styles.clientPickerChevron}>›</Text>
                </TouchableOpacity>
              );
            }}
          />
          {errors.clientSnapshot && (
            <Text style={styles.errorText}>{t('common:fieldRequired')}</Text>
          )}
        </Card>

        {/* Date & Due Date */}
        <Card style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('document:date')}</Text>
          <View style={styles.row2}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="date"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('document:date')}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      scheduleAutoSave();
                    }}
                    placeholder="yyyy-MM-dd"
                    keyboardType="numeric"
                    error={errors.date ? t('common:fieldRequired') : undefined}
                  />
                )}
              />
            </View>
            {watchedType === 'invoice' && (
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t('document:dueDate')}
                      value={value ?? ''}
                      onChangeText={(text) => {
                        onChange(text || null);
                        scheduleAutoSave();
                      }}
                      placeholder="yyyy-MM-dd"
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
            )}
          </View>
        </Card>

        {/* Language & Currency */}
        <Card style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('document:language')}</Text>

          {/* Language Toggle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('document:language')}</Text>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  watchedLanguage === 'fr' && styles.languageOptionActive,
                ]}
                onPress={() => setValue('language', 'fr')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    watchedLanguage === 'fr' && styles.languageOptionTextActive,
                  ]}
                >
                  {t('settings:languageOptions.fr')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  watchedLanguage === 'en' && styles.languageOptionActive,
                ]}
                onPress={() => setValue('language', 'en')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    watchedLanguage === 'en' && styles.languageOptionTextActive,
                  ]}
                >
                  {t('settings:languageOptions.en')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Currency Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('document:currency')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCurrencyPicker((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerButtonText}>
                {currencyConfig.symbol} {currencyConfig.code} — {currencyConfig.name}
              </Text>
              <Text style={styles.pickerChevron}>
                {showCurrencyPicker ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {showCurrencyPicker && (
              <View style={styles.currencyDropdown}>
                <ScrollView style={styles.currencyScroll} nestedScrollEnabled>
                  {CURRENCY_LIST.slice(0, 30).map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={[
                        styles.currencyItem,
                        watchedCurrencyCode === c.code &&
                          styles.currencyItemSelected,
                      ]}
                      onPress={() => {
                        setValue('currencyCode', c.code);
                        setShowCurrencyPicker(false);
                        scheduleAutoSave();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.currencyItemText,
                          watchedCurrencyCode === c.code &&
                            styles.currencyItemTextSelected,
                        ]}
                      >
                        {c.symbol} {c.code} — {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </Card>

        {/* Line Items */}
        <Card style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('document:items')}</Text>
          {fields.map((field, index) => renderLineItem(field as LineItemFormData & { id: string }, index))}
          <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem} activeOpacity={0.7}>
            <Text style={styles.addItemButtonText}>+ {t('document:addItem')}</Text>
          </TouchableOpacity>
        </Card>

        {/* Global Discount */}
        <Card style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('document:globalDiscount')}</Text>
          <View style={styles.discountTypeRow}>
            {(['none', 'percentage', 'fixed'] as const).map((dt) => (
              <TouchableOpacity
                key={dt}
                style={[
                  styles.discountTypeChip,
                  (dt === 'none'
                    ? watchedGlobalDiscountType == null
                    : watchedGlobalDiscountType === dt) && styles.discountTypeChipActive,
                ]}
                onPress={() => {
                  if (dt === 'none') {
                    setValue('globalDiscountType', null);
                    setValue('globalDiscountValue', null);
                  } else {
                    setValue('globalDiscountType', dt);
                  }
                  scheduleAutoSave();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.discountTypeChipText,
                    (dt === 'none'
                      ? watchedGlobalDiscountType == null
                      : watchedGlobalDiscountType === dt) &&
                      styles.discountTypeChipTextActive,
                  ]}
                >
                  {dt === 'none'
                    ? t('common:none')
                    : dt === 'percentage'
                    ? t('document:discountType.percentage')
                    : t('document:discountType.fixed')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {watchedGlobalDiscountType != null && (
            <Controller
              control={control}
              name="globalDiscountValue"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('document:discount')}
                  value={value != null ? String(value) : ''}
                  onChangeText={(text) => {
                    const parsed = parseFloat(text.replace(',', '.'));
                    onChange(isNaN(parsed) ? null : parsed);
                    scheduleAutoSave();
                  }}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              )}
            />
          )}
        </Card>

        {/* Notes & Terms */}
        <Card style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('document:notes')}</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('document:notes')}
                value={value ?? ''}
                onChangeText={(text) => {
                  onChange(text || null);
                  scheduleAutoSave();
                }}
                multiline
                numberOfLines={3}
                placeholder={t('common:optional')}
              />
            )}
          />
          <Controller
            control={control}
            name="terms"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('document:terms')}
                value={value ?? ''}
                onChangeText={(text) => {
                  onChange(text || null);
                  scheduleAutoSave();
                }}
                multiline
                numberOfLines={3}
                placeholder={t('common:optional')}
              />
            )}
          />
        </Card>

        {/* Convert Quote to Invoice */}
        {isQuote && documentId && !isConverted && (
          <Card style={[styles.section, styles.convertSection]} elevation={1}>
            <Button
              title={converting ? t('common:loading') : t('document:convertToInvoice')}
              onPress={() => setConvertConfirmVisible(true)}
              variant="secondary"
              fullWidth
              loading={converting}
              disabled={converting}
            />
          </Card>
        )}

        {/* Document Total Footer */}
        <Card style={[styles.section, styles.totalsSection]} elevation={1}>
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>{t('document:subtotal')}</Text>
            <Text style={styles.totalRowValue}>
              {formatCurrency(docCalc.subtotal, currencyConfig)}
            </Text>
          </View>
          {docCalc.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>{t('document:discount')}</Text>
              <Text style={[styles.totalRowValue, styles.totalRowNegative]}>
                -{formatCurrency(docCalc.discountAmount, currencyConfig)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>{t('document:taxableAmount')}</Text>
            <Text style={styles.totalRowValue}>
              {formatCurrency(docCalc.taxableAmount, currencyConfig)}
            </Text>
          </View>
          {docCalc.taxLines.map((tl) => (
            <View key={tl.taxRateId} style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>
                {tl.name} ({tl.rate}%)
              </Text>
              <Text style={styles.totalRowValue}>
                {formatCurrency(tl.taxAmount, currencyConfig)}
              </Text>
            </View>
          ))}
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>{t('document:total')}</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(docCalc.total, currencyConfig)}
            </Text>
          </View>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Convert Confirm Modal */}
      <Modal
        visible={convertConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConvertConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>{t('document:convertToInvoice')}</Text>
            <Text style={styles.confirmMessage}>{t('document:convertConfirm')}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setConvertConfirmVisible(false)}
                disabled={converting}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonCancelText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonPrimary]}
                onPress={() => void handleConvertToInvoice()}
                disabled={converting}
                activeOpacity={0.7}
              >
                {converting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonPrimaryText}>{t('common:confirm')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 56 : SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.Surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  headerButton: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
  },
  headerButtonText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextPrimary,
    textAlign: 'center',
    marginHorizontal: SPACING.xs,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerButtonPrimary: {
    backgroundColor: COLORS.Primary,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPrimaryText: {
    fontSize: FONT_SIZE.md,
    color: '#fff',
    fontWeight: FONT_WEIGHT.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  typeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.xs,
    backgroundColor: COLORS.SurfaceVariant,
  },
  typeOptionActive: {
    backgroundColor: COLORS.Primary,
  },
  typeOptionIcon: {
    fontSize: FONT_SIZE.md,
  },
  typeOptionText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
  },
  typeOptionTextActive: {
    color: '#fff',
    fontWeight: FONT_WEIGHT.semibold,
  },
  clientPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.Surface,
  },
  clientPickerButtonError: {
    borderColor: COLORS.Error,
  },
  clientPickerText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    flex: 1,
  },
  clientPickerPlaceholder: {
    color: COLORS.TextDisabled,
  },
  clientPickerChevron: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.TextSecondary,
    marginLeft: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.Error,
    marginTop: 2,
  },
  row2: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfField: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
    marginBottom: 4,
  },
  languageToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.SurfaceVariant,
  },
  languageOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  languageOptionActive: {
    backgroundColor: COLORS.Primary,
  },
  languageOptionText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  languageOptionTextActive: {
    color: '#fff',
    fontWeight: FONT_WEIGHT.semibold,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.Surface,
  },
  pickerButtonText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    flex: 1,
  },
  pickerChevron: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextSecondary,
    marginLeft: SPACING.xs,
  },
  currencyDropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.Surface,
    overflow: 'hidden',
  },
  currencyScroll: {
    maxHeight: 200,
  },
  currencyItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Divider,
  },
  currencyItemSelected: {
    backgroundColor: COLORS.Primary + '1A',
  },
  currencyItemText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
  },
  currencyItemTextSelected: {
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  lineItemContainer: {
    backgroundColor: COLORS.SurfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  lineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  lineItemLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextSecondary,
  },
  removeItemText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.Error,
    fontWeight: FONT_WEIGHT.medium,
  },
  taxRatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  taxChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.Border,
    backgroundColor: COLORS.Surface,
  },
  taxChipActive: {
    backgroundColor: COLORS.Primary,
    borderColor: COLORS.Primary,
  },
  taxChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  taxChipTextActive: {
    color: '#fff',
  },
  noTaxText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextDisabled,
    fontStyle: 'italic',
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.Border,
  },
  itemTotalLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  itemTotalValue: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    fontWeight: FONT_WEIGHT.bold,
  },
  addItemButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.Primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
  },
  addItemButtonText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  discountTypeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  discountTypeChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.Border,
    backgroundColor: COLORS.Surface,
  },
  discountTypeChipActive: {
    backgroundColor: COLORS.Secondary,
    borderColor: COLORS.Secondary,
  },
  discountTypeChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  discountTypeChipTextActive: {
    color: '#fff',
  },
  convertSection: {
    borderColor: COLORS.Secondary,
    borderWidth: 1,
  },
  totalsSection: {
    backgroundColor: COLORS.SurfaceVariant,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
  },
  totalRowLabel: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
  },
  totalRowValue: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  totalRowNegative: {
    color: COLORS.Success,
  },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.Border,
    marginVertical: SPACING.sm,
  },
  grandTotalLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
  },
  grandTotalValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.Primary,
  },
  bottomPadding: {
    height: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.Overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  confirmModal: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  confirmTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
    marginBottom: SPACING.sm,
  },
  confirmMessage: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    lineHeight: FONT_SIZE.base * 1.5,
    marginBottom: SPACING.lg,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmButtonCancel: {
    backgroundColor: COLORS.Surface,
    borderColor: COLORS.Border,
  },
  confirmButtonPrimary: {
    backgroundColor: COLORS.Secondary,
    borderColor: COLORS.Secondary,
  },
  confirmButtonCancelText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextSecondary,
  },
  confirmButtonPrimaryText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#fff',
  },
});
