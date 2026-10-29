import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { Avatar } from '@/components/ui/avatar';

export function WebHeader() {
  const { t, language, setLanguage } = usePrefs();
  const { status, profile } = useAuth();
  return (
    <View className="h-16 flex-row items-center gap-4 border-b border-line bg-surface px-6 dark:border-line-dark dark:bg-surface-dark">
      <View className="max-w-2xl flex-1 flex-row items-center gap-2 rounded-full bg-canvas px-4 py-2 dark:bg-canvas-dark">
        <Ionicons name="search" size={18} color={Colors.inactive} />
        <TextInput
          accessibilityLabel={t('nav.search')}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={Colors.placeholder}
          className="flex-1 text-sm text-ink outline-none dark:text-ink-dark"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="min-h-11 justify-center px-2">
        <Text className="text-sm font-semibold text-muted dark:text-muted-dark">{language === 'ar' ? 'English' : 'العربية'}</Text>
      </Pressable>
      {status === 'signedIn' ? (
        <Avatar name={profile?.displayName} uri={profile?.avatarUrl} size={36} />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/sign-in')}
          className="min-h-11 justify-center rounded-full bg-brand-600 px-4 dark:bg-brand-400">
          <Text className="text-sm font-bold text-white dark:text-canvas-dark">{t('auth.signIn')}</Text>
        </Pressable>
      )}
    </View>
  );
}
