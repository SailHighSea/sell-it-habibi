import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';

type Props = { message: string; actionLabel?: string; onAction?: () => void };

export function EmptyState({ message, actionLabel, onAction }: Props) {
  return (
    <View className="mt-10 items-center gap-3 px-6">
      <Text className="text-center text-base text-muted dark:text-muted-dark">{message}</Text>
      {actionLabel && onAction ? <Button variant="outline" label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
