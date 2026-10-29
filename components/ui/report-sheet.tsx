import { useState } from 'react';
import { Text, View } from 'react-native';

import { REPORT_REASONS, type ReportReason } from '@/lib/chat-types';
import { usePrefs } from '@/providers/prefs-provider';

import { Button } from './button';
import { Chip } from './chip';
import { Sheet } from './sheet';
import { TextField } from './text-field';

type Props = { visible: boolean; title: string; onClose: () => void; onSubmit: (reason: ReportReason, details: string) => Promise<void> };

/** Reason and optional details. Shows a thank-you after sending. */
export function ReportSheet({ visible, title, onClose, onSubmit }: Props) {
  const { t } = usePrefs();
  const [reason, setReason] = useState<ReportReason>('scam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const close = () => {
    setSent(false);
    setError(null);
    setDetails('');
    onClose();
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(reason, details);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error && e.message.includes('rate_limited') ? t('report.rateLimited') : t('my.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title={title} onClose={close}>
      {sent ? (
        <View className="gap-3">
          <Text className="text-base text-ink dark:text-ink-dark">{t('listing.reported')}</Text>
          <Button label={t('common.back')} onPress={close} />
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('safety.reason')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <Chip key={r} label={t(`reason.${r}`)} selected={reason === r} onPress={() => setReason(r)} />
            ))}
          </View>
          <TextField label={t('safety.details')} value={details} onChangeText={setDetails} multiline maxLength={1000} className="min-h-24 pt-3" style={{ textAlignVertical: 'top' }} error={error} />
          <Button label={t('safety.submit')} onPress={submit} loading={busy} />
        </View>
      )}
    </Sheet>
  );
}
