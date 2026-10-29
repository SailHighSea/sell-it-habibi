import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { registerPushToken, unregisterPushToken } from '@/lib/push';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';

if (Platform.OS !== 'web') {
  // Show pushes that arrive while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** Renders nothing. Keeps this phone's push token in step with sign-in and the notifications setting, and opens the chat when a push is tapped. */
export function PushRegistrar() {
  const { status, user } = useAuth();
  const { notifications } = usePrefs();
  const userId = status === 'signedIn' ? user?.id : undefined;

  useEffect(() => {
    if (!userId) return;
    if (notifications) registerPushToken(userId);
    else unregisterPushToken();
  }, [userId, notifications]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const threadId = (response.notification.request.content.data as { threadId?: string } | undefined)?.threadId;
      if (threadId) router.push(`/thread/${threadId}`);
    });
    return () => sub.remove();
  }, []);

  return null;
}
