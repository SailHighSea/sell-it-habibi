import { Pressable, Text } from 'react-native';

type Props = { label: string; selected?: boolean; onPress?: () => void };

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      className={`min-h-11 justify-center rounded-full border px-4 ${
        selected ? 'border-transparent bg-brand-50 dark:bg-hero-dark' : 'border-line bg-surface dark:border-line-dark dark:bg-surface-dark'
      }`}>
      <Text
        className={`text-sm ${
          selected ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-medium text-ink dark:text-ink-dark'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}
