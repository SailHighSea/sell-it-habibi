import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { REPORT_REASONS, type ReportReason, type ThreadListing } from '@/lib/chat-types';
import { availableHours, buildMeetupAt, meetupDays, type MeetupDay } from '@/lib/meetup';
import { formatMinor, minorDigits, parseMinor } from '@/lib/money';
import { checkOffer, suggestOffers } from '@/lib/offers';
import { usePrefs } from '@/providers/prefs-provider';

// ---------------------------------------------------------------- offer
type OfferProps = {
  visible: boolean;
  counter?: boolean;
  listing: ThreadListing;
  onClose: () => void;
  /** Throws to show "could not send". */
  onSubmit: (amountMinor: number) => Promise<void>;
};

export function OfferSheet({ visible, counter, listing, onClose, onSubmit }: OfferProps) {
  const { t, locale } = usePrefs();
  const digits = minorDigits(listing.currency);
  const [text, setText] = useState(listing.fixedPrice ? String(listing.priceMinor / 10 ** digits) : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amount = parseMinor(text, listing.currency);
    const problem = checkOffer(amount, listing);
    if (problem) {
      setError(t(`offer.err.${problem}`));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(amount as number);
      onClose();
    } catch {
      setError(t('offer.err.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title={counter ? t('offer.counterTitle') : t('offer.title')} onClose={onClose}>
      <Text className="text-sm text-muted dark:text-muted-dark">{t('offer.asking', { price: formatMinor(listing.priceMinor, listing.currency, locale) })}</Text>
      <TextField
        label={t('offer.amount', { currency: listing.currency })}
        value={text}
        onChangeText={setText}
        keyboardType="decimal-pad"
        editable={!listing.fixedPrice}
        error={error}
        help={listing.fixedPrice ? t('offer.fixedNote') : undefined}
        style={{ textAlign: 'left', writingDirection: 'ltr' }}
        autoFocus={!listing.fixedPrice}
      />
      {listing.fixedPrice ? null : (
        <View className="flex-row flex-wrap gap-2">
          {suggestOffers(listing.priceMinor, listing.currency).map((v) => (
            <Chip key={v} label={formatMinor(v, listing.currency, locale)} selected={parseMinor(text, listing.currency) === v} onPress={() => setText(String(v / 10 ** digits))} />
          ))}
        </View>
      )}
      <Button label={t('offer.send')} onPress={submit} loading={busy} />
    </Sheet>
  );
}

// ---------------------------------------------------------------- meet-up
type MeetupProps = { visible: boolean; onClose: () => void; onSubmit: (place: string, atIso: string) => Promise<void> };

export function MeetupSheet({ visible, onClose, onSubmit }: MeetupProps) {
  const { t, locale } = usePrefs();
  const [days] = useState(() => meetupDays());
  const [day, setDay] = useState<MeetupDay>(days[1] ?? days[0]);
  const [hour, setHour] = useState<number | null>(null);
  const [place, setPlace] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hours = availableHours(day);
  const dayLabel = (d: MeetupDay) =>
    d.offset === 0 ? t('meetup.today') : d.offset === 1 ? t('meetup.tomorrow') : new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' }).format(new Date(d.iso));
  const hourLabel = (h: number) => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h));

  const submit = async () => {
    if (!place.trim()) return setError(t('meetup.placeRequired'));
    const h = hour !== null && hours.includes(hour) ? hour : hours[0];
    if (h === undefined) return setError(t('meetup.noSlots'));
    setError(null);
    setBusy(true);
    try {
      await onSubmit(place, buildMeetupAt(day, h));
      setPlace('');
      onClose();
    } catch {
      setError(t('chat.sendFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title={t('meetup.title')} onClose={onClose}>
      <TextField label={t('meetup.place')} value={place} onChangeText={setPlace} placeholder={t('meetup.placePlaceholder')} maxLength={120} error={error} />
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('meetup.day')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {days.map((d) => (
            <Chip key={d.iso} label={dayLabel(d)} selected={day.iso === d.iso} onPress={() => setDay(d)} />
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('meetup.time')}</Text>
        {hours.length ? (
          <View className="flex-row flex-wrap gap-2">
            {hours.map((h) => (
              <Chip key={h} label={hourLabel(h)} selected={(hour !== null && hours.includes(hour) ? hour : hours[0]) === h} onPress={() => setHour(h)} />
            ))}
          </View>
        ) : (
          <Text className="text-sm text-muted dark:text-muted-dark">{t('meetup.noSlots')}</Text>
        )}
      </View>
      <Text className="text-xs text-muted dark:text-muted-dark">{t('meetup.safety')}</Text>
      <Button label={t('meetup.send')} onPress={submit} loading={busy} />
    </Sheet>
  );
}

// ---------------------------------------------------------------- safety (mute, block, report)
type SafetyProps = {
  visible: boolean;
  name: string;
  muted: boolean;
  blocked: boolean;
  onClose: () => void;
  onMute: (muted: boolean) => Promise<void>;
  onBlock: (blocked: boolean) => Promise<void>;
  onReport: (reason: ReportReason, details: string) => Promise<void>;
};

export function SafetySheet({ visible, name, muted, blocked, onClose, onMute, onBlock, onReport }: SafetyProps) {
  const { t } = usePrefs();
  const [mode, setMode] = useState<'menu' | 'block' | 'report' | 'thanks'>('menu');
  const [reason, setReason] = useState<ReportReason>('scam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setMode('menu');
    setError(null);
    onClose();
  };
  const run = async (fn: () => Promise<void>, then: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      then();
    } catch {
      setError(t('my.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title={mode === 'report' ? t('safety.reportTitle') : t('safety.menu')} onClose={close}>
      {mode === 'menu' ? (
        <View className="gap-3">
          <Button variant="outline" label={muted ? t('safety.unmute') : t('safety.mute')} onPress={() => run(() => onMute(!muted), close)} loading={busy} />
          <Button
            variant="outline"
            label={blocked ? t('safety.unblock', { name }) : t('safety.block', { name })}
            onPress={() => (blocked ? run(() => onBlock(false), close) : setMode('block'))}
          />
          <Button variant="outline" label={t('safety.report')} onPress={() => setMode('report')} />
        </View>
      ) : null}
      {mode === 'block' ? (
        <View className="gap-3">
          <Text className="text-base text-ink dark:text-ink-dark">{t('safety.blockConfirm', { name })}</Text>
          <Button label={t('safety.confirm')} onPress={() => run(() => onBlock(true), close)} loading={busy} />
          <Button variant="ghost" label={t('common.cancel')} onPress={() => setMode('menu')} />
        </View>
      ) : null}
      {mode === 'report' ? (
        <View className="gap-3">
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('safety.reason')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <Chip key={r} label={t(`reason.${r}`)} selected={reason === r} onPress={() => setReason(r)} />
            ))}
          </View>
          <TextField label={t('safety.details')} value={details} onChangeText={setDetails} multiline maxLength={1000} className="min-h-24 pt-3" style={{ textAlignVertical: 'top' }} />
          <Button label={t('safety.submit')} onPress={() => run(() => onReport(reason, details), () => setMode('thanks'))} loading={busy} />
        </View>
      ) : null}
      {mode === 'thanks' ? (
        <View className="gap-3">
          <Text className="text-base text-ink dark:text-ink-dark">{t('safety.thanks')}</Text>
          <Button label={t('common.back')} onPress={close} />
        </View>
      ) : null}
      {error ? <Text className="text-xs text-danger dark:text-danger-dark">{error}</Text> : null}
    </Sheet>
  );
}
