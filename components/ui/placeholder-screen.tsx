import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { IconName } from '@/constants/navigation';

type Props = { icon: IconName; title: string; subtitle: string };

export function PlaceholderScreen({ icon, title, subtitle }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-slate-50 p-8 dark:bg-slate-900">
      <Ionicons name={icon} size={56} color="#0e8f6a" />
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">{title}</Text>
      <Text className="max-w-sm text-center text-slate-500 dark:text-slate-400">{subtitle}</Text>
    </View>
  );
}
