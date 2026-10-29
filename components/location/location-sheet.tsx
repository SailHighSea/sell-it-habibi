import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { citiesIn } from '@/constants/cities';
import { Colors } from '@/constants/theme';
import { RADIUS_OPTIONS_KM } from '@/lib/geo';
import { useLocation } from '@/providers/location-provider';
import { usePrefs } from '@/providers/prefs-provider';

/** Pick where "near me" is measured from (phone location or a city) and how far to look. */
export function LocationSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, country, language } = usePrefs();
  const { city, usingGps, radiusKm, setCity, setRadiusKm, locateMe } = useLocation();
  const [message, setMessage] = useState<string | null>(null);

  const locate = async () => {
    const { status } = await locateMe();
    setMessage(status === 'denied' ? t('loc.denied') : status === 'unavailable' ? t('loc.unavailable') : null);
  };

  return (
    <Sheet visible={visible} title={t('loc.change')} onClose={onClose}>
      <View className="gap-2">
        <Chip label={usingGps ? t('loc.usingGps') : t('loc.useMine')} selected={usingGps} onPress={locate} />
        {message ? <Text className="text-xs text-danger dark:text-danger-dark">{message}</Text> : null}
      </View>
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('loc.city')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {citiesIn(country.code).map((c) => (
            <Chip key={c.id} label={language === 'ar' ? c.ar : c.en} selected={!usingGps && c.id === city.id} onPress={() => setCity(c.id)} />
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('loc.radius')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {RADIUS_OPTIONS_KM.map((km) => (
            <Chip key={km} label={t('loc.km', { km })} selected={km === radiusKm} onPress={() => setRadiusKm(km)} />
          ))}
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <Ionicons name="lock-closed-outline" size={14} color={Colors.inactive} />
        <Text className="flex-1 text-xs text-muted dark:text-muted-dark">{t('loc.privacy')}</Text>
      </View>
    </Sheet>
  );
}
