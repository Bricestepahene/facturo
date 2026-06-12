// App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { DatabaseProvider } from '@/db/client';
import { AppNavigator } from '@/navigation/AppNavigator';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { useUsageStore } from '@/stores/usageStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { initializeIap } from '@/services/monetization/IapService';
import { initializeNotifications } from '@/services/notifications/NotificationService';
import { LoadingScreen } from '@/components/common';
import '@/i18n';

export default function App() {
  return (
    <DatabaseProvider>
      <AppBootstrap />
    </DatabaseProvider>
  );
}

function AppBootstrap() {
  const [ready, setReady] = useState(false);
  const hydrateUsage = useUsageStore((s) => s.hydrate);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);

  useEffect(() => {
    async function bootstrap() {
      try {
        const usage = await settingsRepository.checkAndResetMonthlyCount();
        hydrateUsage(usage);
        hydrateOnboarding(usage.hasSeenOnboarding);
        initializeIap().catch(() => null);
        initializeNotifications().catch(() => null);
      } catch {
        // DB errors surface via DatabaseProvider
      } finally {
        setReady(true);
      }
    }
    bootstrap();
  }, [hydrateUsage, hydrateOnboarding]);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <AppNavigator />
    </>
  );
}
