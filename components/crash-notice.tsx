import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';

import { clearCrash, crashText, readCrash, type CrashInfo } from '@/lib/crash';

/** On the first launch after the app closed unexpectedly, shows what went wrong and lets the person send the details. */
export function CrashNotice() {
  const [crash, setCrash] = useState<CrashInfo | null>(null);

  useEffect(() => {
    readCrash().then(setCrash);
  }, []);

  if (!crash) return null;
  const dismiss = () => {
    clearCrash();
    setCrash(null);
  };

  return (
    <View className="absolute inset-x-0 bottom-0 top-0 justify-end bg-black/60" style={{ zIndex: 100 }}>
      <View className="max-h-[80%] gap-3 rounded-t-3xl bg-white p-5" style={{ backgroundColor: '#FFFFFF' }}>
        <Text accessibilityRole="header" style={{ color: '#0F1F1A', fontSize: 18, fontWeight: '700' }}>
          The app closed unexpectedly · أغلق التطبيق بشكل غير متوقع
        </Text>
        <ScrollView style={{ maxHeight: 220 }}>
          <Text selectable style={{ color: '#55645D', fontSize: 12 }}>
            {crash.message}
            {'\n\n'}
            {crash.stack}
          </Text>
        </ScrollView>
        <View className="flex-row gap-3">
          <Pressable accessibilityRole="button" onPress={() => Share.share({ message: crashText(crash) }).catch(() => {})} className="min-h-12 flex-1 items-center justify-center rounded-full" style={{ backgroundColor: '#0B6E4F' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Share details · مشاركة</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={dismiss} className="min-h-12 flex-1 items-center justify-center rounded-full" style={{ borderWidth: 1.5, borderColor: '#0B6E4F' }}>
            <Text style={{ color: '#0B6E4F', fontWeight: '700' }}>Dismiss · إغلاق</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
