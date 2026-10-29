import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import type { Message, ThreadListing } from '@/lib/chat-types';
import { formatMinor } from '@/lib/money';
import { canCounter } from '@/lib/offers';
import { usePrefs } from '@/providers/prefs-provider';
import { chatImageUrl } from '@/services/chat';

type Props = {
  message: Message;
  mine: boolean;
  listing: ThreadListing | null;
  onRespond: (message: Message, action: 'accept' | 'decline' | 'counter') => void;
};

export function MessageBubble({ message, mine, listing, onRespond }: Props) {
  const { t, locale, language } = usePrefs();

  if (message.kind === 'system') {
    const event = String(message.meta.event ?? '');
    const amount = formatMinor(Number(message.meta.amount_minor ?? 0), String(message.meta.currency ?? listing?.currency ?? 'AED'), locale);
    const key = event === 'offer_accepted' ? 'chat.sys.offer_accepted' : 'chat.sys.offer_declined';
    return (
      <View className="my-1 items-center px-6">
        <Text className="text-center text-xs text-muted dark:text-muted-dark">{t(key, { amount })}</Text>
      </View>
    );
  }

  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt));
  const side = mine ? 'self-end' : 'self-start';
  const card = mine ? 'bg-brand-600 dark:bg-brand-400' : 'bg-surface dark:bg-surface-dark';
  const ink = mine ? 'text-white dark:text-canvas-dark' : 'text-ink dark:text-ink-dark';
  const faint = mine ? 'text-white/80 dark:text-canvas-dark/70' : 'text-muted dark:text-muted-dark';

  if (message.kind === 'offer') {
    const amount = formatMinor(Number(message.meta.amount_minor ?? 0), String(message.meta.currency ?? 'AED'), locale);
    const status = message.offerStatus ?? 'pending';
    return (
      <View className={`my-1 w-64 gap-2 rounded-card-sm border border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark ${side}`}>
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('chat.offer')}</Text>
        <Text className="text-2xl font-extrabold text-ink dark:text-ink-dark">{amount}</Text>
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-xs font-bold ${status === 'accepted' ? 'text-brand-600 dark:text-brand-400' : status === 'declined' ? 'text-danger dark:text-danger-dark' : 'text-muted dark:text-muted-dark'}`}>
            {t(`chat.status.${status}`)}
          </Text>
          <Text className="text-[10px] text-muted dark:text-muted-dark">{time}</Text>
        </View>
        {status === 'pending' && mine ? <Text className="text-xs text-muted dark:text-muted-dark">{t('chat.waiting')}</Text> : null}
        {status === 'pending' && !mine ? (
          <View className="gap-2">
            <Button label={t('chat.accept')} onPress={() => onRespond(message, 'accept')} className="min-h-11" />
            <View className="flex-row gap-2">
              {listing && canCounter(listing) ? <Button variant="outline" label={t('chat.counter')} onPress={() => onRespond(message, 'counter')} className="min-h-11 flex-1 px-2" /> : null}
              <Button variant="outline" label={t('chat.decline')} onPress={() => onRespond(message, 'decline')} className="min-h-11 flex-1 px-2" />
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  if (message.kind === 'meetup') {
    const when = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(String(message.meta.at)));
    return (
      <View className={`my-1 w-64 gap-1 rounded-card-sm border border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark ${side}`}>
        <View className="flex-row items-center gap-2">
          <Ionicons name="location" size={18} color={Colors.primary} />
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('chat.meetupTitle')}</Text>
        </View>
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{String(message.meta.place ?? '')}</Text>
        <Text className="text-sm text-ink dark:text-ink-dark">{when}</Text>
        <Text className="self-end text-[10px] text-muted dark:text-muted-dark">{time}</Text>
      </View>
    );
  }

  if (message.kind === 'image') {
    return (
      <View className={`my-1 overflow-hidden rounded-2xl ${card} ${side}`}>
        <ChatImage path={message.imagePath ?? ''} label={t('chat.photo')} />
        <Text className={`px-3 pb-1.5 pt-1 text-[10px] ${faint} ${mine ? 'text-end' : ''}`}>{time}</Text>
      </View>
    );
  }

  return (
    <View className={`my-1 max-w-[80%] rounded-2xl px-3 py-2 ${card} ${side}`}>
      <Text className={`text-base ${ink}`} style={{ writingDirection: language === 'ar' ? 'rtl' : 'ltr' }}>
        {message.body}
      </Text>
      <Text className={`mt-0.5 text-[10px] ${faint} ${mine ? 'text-end' : ''}`}>{time}</Text>
    </View>
  );
}

function ChatImage({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    chatImageUrl(path)
      .then((u) => !cancelled && setUrl(u))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [path]);
  return (
    <View className="h-48 w-56 items-center justify-center bg-brand-100 dark:bg-hero-dark">
      {url ? <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={label} /> : <Ionicons name="image-outline" size={32} color={Colors.placeholder} />}
    </View>
  );
}
