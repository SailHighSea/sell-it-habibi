import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { BackdropLayer } from '@/components/ui/backdrop-layer';
import type { IconName } from '@/constants/navigation';
import { Colors } from '@/constants/theme';

type Props = { icon: IconName; title: string; subtitle: string };

export function PlaceholderScreen({ icon, title, subtitle }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3  p-8">
      <BackdropLayer />
      <Ionicons name={icon} size={56} color={Colors.primary} />
      <Text className="text-2xl font-bold text-ink dark:text-ink-dark">{title}</Text>
      <Text className="max-w-sm text-center text-muted dark:text-muted-dark">{subtitle}</Text>
    </View>
  );
}
