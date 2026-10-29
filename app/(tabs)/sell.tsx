import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useT } from '@/providers/prefs-provider';

export default function Screen() {
  const t = useT();
  return <PlaceholderScreen icon="add-circle" title={t('sell.title')} subtitle={t('sell.subtitle')} />;
}
