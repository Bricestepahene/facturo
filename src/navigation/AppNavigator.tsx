// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text, StyleSheet } from 'react-native';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { COLORS } from '@/theme/colors';
import type { RootStackParamList, TabParamList } from './types';

// Screen imports
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import DocumentListScreen from '@/screens/documents/DocumentListScreen';
import ClientListScreen from '@/screens/clients/ClientListScreen';
import ProductListScreen from '@/screens/products/ProductListScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import DocumentEditorScreen from '@/screens/documents/DocumentEditorScreen';
import PdfPreviewScreen from '@/screens/preview/PdfPreviewScreen';
import ClientFormScreen from '@/screens/clients/ClientFormScreen';
import ProductFormScreen from '@/screens/products/ProductFormScreen';
import TaxRatesScreen from '@/screens/settings/TaxRatesScreen';
import BackupScreen from '@/screens/settings/BackupScreen';
import CompanyProfileScreen from '@/screens/settings/CompanyProfileScreen';
import UpgradeProScreen from '@/screens/upgrade/UpgradeProScreen';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Simple icon component using Text (no vector-icons dependency issues)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '🏠', Documents: '📄', Clients: '👥', Products: '📦', Settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[name] ?? '•'}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.Primary,
        tabBarInactiveTintColor: COLORS.TextSecondary,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ focused }) => <TabIcon name="Dashboard" focused={focused} /> }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentListScreen}
        options={{ tabBarLabel: 'Documents', tabBarIcon: ({ focused }) => <TabIcon name="Documents" focused={focused} /> }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientListScreen}
        options={{ tabBarLabel: 'Clients', tabBarIcon: ({ focused }) => <TabIcon name="Clients" focused={focused} /> }}
      />
      <Tab.Screen
        name="Products"
        component={ProductListScreen}
        options={{ tabBarLabel: 'Produits', tabBarIcon: ({ focused }) => <TabIcon name="Products" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Réglages', tabBarIcon: ({ focused }) => <TabIcon name="Settings" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const hasSeenOnboarding = useOnboardingStore(s => s.hasSeenOnboarding);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasSeenOnboarding ? 'Main' : 'Onboarding'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="DocumentEditor"
          component={DocumentEditorScreen}
          options={{ headerShown: true, title: 'Document', presentation: 'modal' }}
        />
        <Stack.Screen
          name="PdfPreview"
          component={PdfPreviewScreen}
          options={{ headerShown: true, title: 'Aperçu PDF', presentation: 'modal' }}
        />
        <Stack.Screen
          name="ClientForm"
          component={ClientFormScreen}
          options={{ headerShown: true, title: 'Client', presentation: 'modal' }}
        />
        <Stack.Screen
          name="ProductForm"
          component={ProductFormScreen}
          options={{ headerShown: true, title: 'Produit', presentation: 'modal' }}
        />
        <Stack.Screen
          name="TaxRates"
          component={TaxRatesScreen}
          options={{ headerShown: true, title: 'Taux de TVA' }}
        />
        <Stack.Screen
          name="Backup"
          component={BackupScreen}
          options={{ headerShown: true, title: 'Sauvegarde' }}
        />
        <Stack.Screen
          name="CompanyProfile"
          component={CompanyProfileScreen}
          options={{ headerShown: true, title: 'Profil entreprise' }}
        />
        <Stack.Screen
          name="UpgradePro"
          component={UpgradeProScreen}
          options={{ headerShown: true, title: 'Passer à Pro', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.Surface,
    borderTopColor: COLORS.Border,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 84 : 64,
  },
});
