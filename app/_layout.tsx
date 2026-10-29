import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { PrefsProvider, usePrefs } from '@/providers/prefs-provider';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Routes() {
  const { ready } = usePrefs();
  const { status, profile } = useAuth();
  const loading = !ready || status === 'loading';

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  if (loading) return null;

  const signedIn = status === 'signedIn';
  const needsOnboarding = signedIn && !profile?.onboarded;

  // Guests can browse. Sign-in is only reachable while signed out, and a new account must finish onboarding first.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!needsOnboarding}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !needsOnboarding}>
        <Stack.Screen name="edit-profile" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="verify" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <PrefsProvider>
        <AuthProvider>
          <Routes />
        </AuthProvider>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}
