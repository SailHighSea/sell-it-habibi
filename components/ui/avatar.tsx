import { Image } from 'expo-image';
import { Text, View } from 'react-native';

type Props = { name?: string | null; uri?: string | null; size?: number };

export function Avatar({ name, uri, size = 64 }: Props) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      accessibilityLabel={name ?? undefined}
      className="items-center justify-center overflow-hidden rounded-full bg-brand-50 dark:bg-hero-dark"
      style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text className="font-bold text-brand-700 dark:text-brand-400" style={{ fontSize: size * 0.4 }}>
          {initial}
        </Text>
      )}
    </View>
  );
}
