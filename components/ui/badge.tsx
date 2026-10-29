import { Text, View } from 'react-native';

/** Small red count on top of an icon. Shows nothing for zero. */
export function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View className="absolute -end-2 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-[#E5484D] px-1" pointerEvents="none">
      <Text className="text-[10px] font-bold text-white">{count > 9 ? '9+' : count}</Text>
    </View>
  );
}
