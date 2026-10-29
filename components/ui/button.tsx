import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
};

/** Pill button, 48px tall so the tap target clears 44px. */
export function Button({ label, variant = 'primary', loading, disabled, className, ...rest }: Props) {
  const off = disabled || loading;
  const box =
    variant === 'primary'
      ? 'bg-brand-600 dark:bg-brand-400'
      : variant === 'outline'
        ? 'border-[1.5px] border-brand-600 dark:border-brand-400'
        : '';
  const text =
    variant === 'primary' ? 'text-white dark:text-canvas-dark' : 'text-brand-600 dark:text-brand-400';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-full px-5 ${box} ${off ? 'opacity-50' : ''} ${className ?? ''}`}
      {...rest}>
      {loading ? <ActivityIndicator color="#9AA8A1" /> : null}
      <Text className={`text-base font-bold ${text}`}>{label}</Text>
    </Pressable>
  );
}
