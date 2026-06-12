// src/navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Main: undefined;
  DocumentEditor: { documentId?: string; type?: 'invoice' | 'quote' };
  PdfPreview: { documentId: string };
  ClientForm: { clientId?: string };
  ProductForm: { productId?: string };
  TaxRates: undefined;
  Backup: undefined;
  CompanyProfile: undefined;
  UpgradePro: undefined;
  Onboarding: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Documents: undefined;
  Clients: undefined;
  Products: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
