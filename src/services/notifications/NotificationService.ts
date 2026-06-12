// src/services/notifications/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function initializeNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Rappels factures',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

export async function scheduleInvoiceReminder(
  documentId: string,
  documentNumber: string,
  dueDate: string,
  clientName: string,
): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  const due = new Date(dueDate);
  const reminderDate = new Date(due);
  reminderDate.setDate(reminderDate.getDate() - 1);

  if (reminderDate <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Facture à échéance demain',
      body: `${documentNumber} — ${clientName} arrive à échéance demain.`,
      data: { documentId },
    },
    trigger: {
      date: reminderDate,
      channelId: 'reminders',
    },
  });

  return id;
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export const NotificationService = {
  initializeNotifications,
  scheduleInvoiceReminder,
  cancelReminder,
  cancelAllReminders,
};
