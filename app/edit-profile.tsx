import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { uploadAvatar, validateDisplayName } from '@/services/profile';

export default function EditProfile() {
  const { t } = usePrefs();
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [avatar, setAvatar] = useState(profile?.avatarUrl ?? null);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setPickedUri(res.assets[0].uri);
      setAvatar(res.assets[0].uri);
    }
  };

  const save = async () => {
    if (!profile) return;
    if (!validateDisplayName(name)) {
      setError(t('onboarding.nameInvalid'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const avatarUrl = pickedUri ? await uploadAvatar(profile.id, pickedUri) : avatar;
      await updateProfile({ displayName: name.trim(), bio: bio.trim() || null, city: city.trim() || null, avatarUrl });
      router.back();
    } catch {
      setError(t('onboarding.saveFailed'));
      setBusy(false);
    }
  };

  return (
    <Screen title={t('profile.edit')} footer={<Button label={t('common.save')} onPress={save} loading={busy} />}>
      <View className="items-center gap-2">
        <Avatar name={name} uri={avatar} size={96} />
        <Pressable accessibilityRole="button" onPress={pick} className="min-h-11 justify-center px-3">
          <Text className="text-sm font-bold text-brand-600 dark:text-brand-400">{t('profile.changePhoto')}</Text>
        </Pressable>
      </View>
      <TextField label={t('onboarding.name')} value={name} onChangeText={setName} maxLength={30} help={t('onboarding.nameHelp')} error={error} />
      <TextField label={t('onboarding.city')} value={city} onChangeText={setCity} maxLength={60} />
      <TextField
        label={t('profile.bio')}
        value={bio}
        onChangeText={setBio}
        placeholder={t('profile.bioPlaceholder')}
        maxLength={300}
        multiline
        className="min-h-24 pt-3"
        style={{ textAlignVertical: 'top' }}
      />
    </Screen>
  );
}
