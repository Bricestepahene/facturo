// src/db/client.ts
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from '@/db/schema';
import migrations from '@/db/migrations';

// ─── SQLite connection ────────────────────────────────────────────────────────
const sqliteDb = openDatabaseSync('facturo.db', { enableChangeListener: true });

// ─── Drizzle instance (exported for use in repositories) ─────────────────────
export const db = drizzle(sqliteDb, { schema });

// ─── Migration hook ───────────────────────────────────────────────────────────
export function useDatabaseMigrations() {
  return useMigrations(db, migrations);
}

// ─── Styles for DatabaseProvider ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── DatabaseProvider ─────────────────────────────────────────────────────────
interface DatabaseProviderProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

export function DatabaseProvider({ children, onError }: DatabaseProviderProps): React.ReactElement {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    if (onError) {
      onError(error);
    }
    // Return a minimal fallback — in production a proper error screen should be rendered
    return React.createElement(View, { style: styles.container });
  }

  if (!success) {
    return React.createElement(
      View,
      { style: styles.container },
      React.createElement(ActivityIndicator, { size: 'large', color: '#1E40AF' }),
    );
  }

  return React.createElement(React.Fragment, null, children);
}
