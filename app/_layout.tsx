import '../global.css';

import { useColorScheme, vars } from 'nativewind';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Pressable, Share, Text, View, useColorScheme as useRNColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CrashNotice } from '@/components/crash-notice';
import { PushRegistrar } from '@/components/push-registrar';
import { themeVars } from '@/constants/palettes';
import { crashText, installCrashCapture, saveCrash } from '@/lib/crash';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { EngagementProvider } from '@/providers/engagement-provider';
import { InboxProvider } from '@/providers/inbox-provider';
import { LocationProvider } from '@/providers/location-provider';
import { PrefsProvider, usePrefs } from '@/providers/prefs-provider';
import { isStaff } from '@/services/moderation';

SplashScreen.preventAutoHideAsync().catch(() => {});
installCrashCapture();

/** If a screen throws, show the error (with a way to send it) instead of closing the app. Plain views only: providers may not be mounted here. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    saveCrash(error, false);
    SplashScreen.hideAsync().catch(() => {});
  }, [error]);
  const details = crashText({ message: String(error?.message ?? error), stack: String(error?.stack ?? '').split('\n').slice(0, 14).join('\n'), fatal: false, at: new Date().toISOString() });
  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#F4F6F5' }}>
      <Text style={{ color: '#0F1F1A', fontSize: 22, fontWeight: '800' }}>Something went wrong · حدث خطأ ما</Text>
      <Text selectable style={{ color: '#55645D', fontSize: 13 }}>{String(error?.message ?? error)}</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={{ minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B6E4F' }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Try again · حاول مرة أخرى</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => Share.share({ message: details }).catch(() => {})} style={{ minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0B6E4F' }}>
        <Text style={{ color: '#0B6E4F', fontWeight: '700' }}>Share details · مشاركة التفاصيل</Text>
      </Pressable>
    </View>
  );
}

function Routes() {
  const { ready, setupDone } = usePrefs();
  const { status, profile } = useAuth();
  const loading = !ready || status === 'loading';

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  if (loading) return null;

  const signedIn = status === 'signedIn';
  const needsOnboarding = signedIn && !profile?.onboarded;
  // First launch: choose language, country, city and look before anything else.
  const needsSetup = !setupDone;

  // Browsing needs no account: feed, search, listings, sellers, likes, follows and saved searches all work as a guest.
  // An account is needed only to chat (offers and meet-ups included) and to sell. A new account must finish onboarding first.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={needsSetup}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={!needsSetup && needsOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!needsSetup && !needsOnboarding}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="listing/[id]/index" />
        <Stack.Screen name="seller/[id]" />
        <Stack.Screen name="favorites" />
      </Stack.Protected>
      <Stack.Protected guard={!needsSetup && signedIn && !needsOnboarding}>
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="listing/new" />
        <Stack.Screen name="listing/[id]/edit" />
        <Stack.Screen name="my-listings" />
        <Stack.Screen name="review/[listingId]" />
        <Stack.Screen name="thread/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!needsSetup && signedIn && !needsOnboarding && isStaff(profile?.role)}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
      <Stack.Protected guard={!needsSetup && status === 'signedOut'}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="verify" />
      </Stack.Protected>
    </Stack>
  );
}

/** Applies the chosen look and palette colour variables to everything below. */
function LookRoot({ children }: { children: React.ReactNode }) {
  const { look, palette, appearance } = usePrefs();
  const { setColorScheme } = useColorScheme();
  // 'system' follows the phone's light/dark setting automatically; light and dark force it.
  // On web the 'class' dark mode needs an explicit value, so resolve "system" from the browser's own setting.
  const system = useRNColorScheme();
  const black = appearance === 'black';
  const scheme = black ? 'dark' : Platform.OS === 'web' && appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
  useEffect(() => setColorScheme(scheme), [scheme, setColorScheme]);
  const theme = themeVars(palette, look, black);
  // On web, sheets render outside this view in the page, so the colour variables must also sit on the page itself.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    for (const [k, v] of Object.entries(theme)) document.documentElement.style.setProperty(k, v);
  }, [theme]);
  // Keyed by palette so icons that read the palette from code repaint too.
  return (
    <View key={`${palette}-${black}`} style={[{ flex: 1 }, vars(theme)]}>
      {children}
    </View>
  );
}

export default function RootLayout() {
  // Never leave the splash screen up for good, even if something is slow to load.
  useEffect(() => {
    const id = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 8000);
    return () => clearTimeout(id);
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <CrashNotice />
      <PrefsProvider>
        <AuthProvider>
          <EngagementProvider>
            <InboxProvider>
              <LocationProvider>
                <PushRegistrar />
                <LookRoot>
                  <Routes />
                </LookRoot>
              </LocationProvider>
            </InboxProvider>
          </EngagementProvider>
        </AuthProvider>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}
