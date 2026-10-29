import { View } from 'react-native';

import { COUNTRIES, type CountryCode } from '@/constants/countries';
import { usePrefs } from '@/providers/prefs-provider';

import { Chip } from './chip';

export function CountryChips({ value, onChange }: { value: CountryCode; onChange: (c: CountryCode) => void }) {
  const { language } = usePrefs();
  return (
    <View className="flex-row flex-wrap gap-2">
      {COUNTRIES.map((c) => (
        <Chip key={c.code} label={c.name[language]} selected={c.code === value} onPress={() => onChange(c.code)} />
      ))}
    </View>
  );
}
