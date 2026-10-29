import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackdropLayer } from '@/components/ui/backdrop-layer';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';

export default function SellScreen() {
  const { t } = usePrefs();
  const { status } = useAuth();
  const signedIn = status === 'signedIn';

  return (
    <SafeAreaView className="flex-1">
      <BackdropLayer />
      <View className="mx-auto w-full max-w-lg flex-1 justify-center gap-4 px-5">
        <View className="items-center gap-3 rounded-card bg-surface p-6 dark:bg-surface-dark">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-hero-dark">
            <Ionicons name="camera" size={30} color={Colors.primary} />
          </View>
          <Text accessibilityRole="header" className="text-center text-2xl font-extrabold text-ink dark:text-ink-dark">
            {signedIn ? t('sell.createTitle') : t('auth.guestTitle')}
          </Text>
          <Text className="text-center text-base text-muted dark:text-muted-dark">{signedIn ? t('sell.createBody') : t('auth.guestBody')}</Text>
          <Button
            className="self-stretch"
            label={signedIn ? t('sell.createTitle') : t('auth.signIn')}
            onPress={() => router.push(signedIn ? '/listing/new' : '/sign-in')}
          />
        </View>
        {signedIn ? <Button variant="outline" label={t('sell.manage')} onPress={() => router.push('/my-listings')} /> : null}
      </View>
    </SafeAreaView>
  );
}
