import { ActivityIndicator } from 'react-native';

import { EmptyState } from '@/components/listings/empty-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { ListScreen } from '@/components/ui/screen';
import { useAsyncData } from '@/hooks/use-async-data';
import { useAuth } from '@/providers/auth-provider';
import { useEngagement } from '@/providers/engagement-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { fetchFavoriteListings } from '@/services/engagement';

export default function Favorites() {
  const { t } = usePrefs();
  const { user } = useAuth();
  const { isFavorite } = useEngagement();
  const { data, loading, failed, reload } = useAsyncData(`favs|${user?.id}`, () => fetchFavoriteListings(user!.id));
  // Hearts toggled on this screen disappear from the list right away.
  const items = (data ?? []).filter((l) => isFavorite(l.id));

  return (
    <ListScreen title={t('favorites.title')}>
      <ListingGrid
        data={items}
        empty={
          loading ? (
            <ActivityIndicator className="mt-10" />
          ) : failed ? (
            <EmptyState message={t('home.loadFailed')} actionLabel={t('common.retry')} onAction={reload} />
          ) : (
            <EmptyState message={t('favorites.empty')} />
          )
        }
      />
    </ListScreen>
  );
}
