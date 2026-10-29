import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useT } from '@/providers/prefs-provider';

export default function Screen() {
  const t = useT();
  return <PlaceholderScreen icon="chatbubbles" title={t('chats.title')} subtitle={t('chats.subtitle')} />;
}
