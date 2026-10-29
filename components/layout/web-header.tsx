import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, View } from 'react-native';

export function WebHeader() {
  return (
    <View className="h-16 flex-row items-center gap-4 border-b border-slate-200 bg-white px-6 dark:border-slate-700 dark:bg-slate-900">
      <View className="max-w-2xl flex-1 flex-row items-center gap-2 rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800">
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          placeholder="Search cars, phones, furniture..."
          placeholderTextColor="#94a3b8"
          className="flex-1 text-sm text-slate-900 outline-none dark:text-white"
        />
      </View>
      <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">العربية | English</Text>
    </View>
  );
}
