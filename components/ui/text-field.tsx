import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = TextInputProps & { label: string; help?: string; error?: string | null };

export function TextField({ label, help, error, className, ...rest }: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Colors.placeholder}
        className={`min-h-12 rounded-2xl border bg-surface px-4 text-base text-ink dark:bg-surface-dark dark:text-ink-dark ${
          error ? 'border-danger dark:border-danger-dark' : 'border-line dark:border-line-dark'
        } ${className ?? ''}`}
        {...rest}
      />
      {error ? (
        <Text className="text-xs text-danger dark:text-danger-dark">{error}</Text>
      ) : help ? (
        <Text className="text-xs text-muted dark:text-muted-dark">{help}</Text>
      ) : null}
    </View>
  );
}
