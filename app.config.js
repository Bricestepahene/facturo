module.exports = {
  expo: {
    name: 'Facturo',
    slug: 'facturo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1E40AF',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.facturo.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1E40AF',
      },
      package: 'com.facturo.app',
      googleServicesFile: './google-services.json',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-localization',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#1E40AF',
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: process.env.ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713',
        },
      ],
    ],
    extra: {
      admobAppIdAndroid: process.env.ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713',
      iapProductIdOnetime: process.env.IAP_PRODUCT_ID_ONETIME || 'facturo_pro_onetime',
      iapProductIdMonthly: process.env.IAP_PRODUCT_ID_MONTHLY || 'facturo_pro_monthly',
      eas: {
        projectId: process.env.EXPO_PROJECT_ID || '',
      },
    },
  },
};
