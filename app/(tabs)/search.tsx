import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useT } from '@/providers/prefs-provider';

export default function Screen() {
  const t = useT();
  return <PlaceholderScreen icon="search" title={t('search.title')} subtitle={t('search.subtitle')} />;
}
