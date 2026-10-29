import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GradientHeader } from '@/components/ui/gradient-header';
import { RatingSummary } from '@/components/ui/stars';
import { isStaff } from '@/services/moderation';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { useBarInset } from '@/hooks/use-bar-inset';
import { usePrefs } from '@/providers/prefs-provider';

export default function ProfileScreen() {
  const { t } = usePrefs();
  const barInset = useBarInset();
  const { status, profile, signOut } = useAuth();
  const signedIn = status === 'signedIn';

  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: barInset }}>
        <GradientHeader overlap={0}>
          <Avatar name={signedIn ? profile?.displayName : '?'} uri={profile?.avatarUrl} size={56} />
          <View className="flex-1 gap-0.5">
            <Text className="text-xl font-bold text-white">{signedIn ? profile?.displayName : t('auth.guestTitle')}</Text>
            {signedIn ? (
              <View className="flex-row flex-wrap items-center gap-x-2">
                {profile && profile.ratingCount > 0 ? <RatingSummary avg={profile.ratingAvg} count={profile.ratingCount} /> : <Text className="text-xs text-white/90">{t('profile.noReviews')}</Text>}
                {profile?.phoneVerified ? <Text className="text-xs text-white/90">{`· ${t('profile.phoneVerified')}`}</Text> : null}
              </View>
            ) : null}
          </View>
        </GradientHeader>

        <View className="mx-auto w-full max-w-lg gap-4 px-4 pt-4">
          {signedIn ? (
            profile?.bio ? <Text className="text-base text-ink dark:text-ink-dark">{profile.bio}</Text> : null
          ) : (
            <View className="gap-4 rounded-card bg-surface p-5 dark:bg-surface-dark">
              <Text className="text-base text-muted dark:text-muted-dark">{t('auth.guestBody')}</Text>
              <Button label={t('auth.signIn')} onPress={() => router.push('/sign-in')} />
            </View>
          )}

          <View className="overflow-hidden rounded-card bg-surface dark:bg-surface-dark">
            {signedIn ? <Row icon="pricetags-outline" label={t('profile.myListings')} onPress={() => router.push('/my-listings')} /> : null}
            <Row icon="heart-outline" label={t('profile.favorites')} onPress={() => router.push('/favorites')} />
            {signedIn && profile ? <Row icon="star-outline" label={t('profile.myReviews')} onPress={() => router.push(`/seller/${profile.id}`)} /> : null}
            {signedIn && isStaff(profile?.role) ? <Row icon="shield-checkmark-outline" label={t('profile.moderation')} onPress={() => router.push('/admin')} /> : null}
            {signedIn ? <Row icon="create-outline" label={t('profile.edit')} onPress={() => router.push('/edit-profile')} /> : null}
            <Row icon="settings-outline" label={t('profile.settings')} onPress={() => router.push('/settings')} last={!signedIn} />
            {signedIn ? <Row icon="log-out-outline" label={t('auth.signOut')} onPress={signOut} last /> : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; last?: boolean }) {
  const { rtl } = usePrefs();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 px-4 ${last ? '' : 'border-b border-line dark:border-line-dark'}`}>
      <Ionicons name={icon} size={22} color={Colors.primary} />
      <Text className="flex-1 text-base font-medium text-ink dark:text-ink-dark">{label}</Text>
      <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={Colors.inactive} />
    </Pressable>
  );
}
