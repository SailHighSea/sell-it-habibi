import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { EmptyState } from '@/components/listings/empty-state';
import { ListingForm } from '@/components/listings/listing-form';
import { Screen } from '@/components/ui/screen';
import { useAsyncData } from '@/hooks/use-async-data';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { getListing } from '@/services/listings';

export default function EditListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = usePrefs();
  const { user } = useAuth();
  const { data, loading } = useAsyncData(`listing|${id}`, () => getListing(id));

  if (loading) return <Screen title={t('form.editTitle')}><ActivityIndicator className="mt-10" /></Screen>;
  // Only the seller may edit; the database enforces this too.
  if (!data || data.sellerId !== user?.id) {
    return <Screen title={t('form.editTitle')}><View><EmptyState message={t('listing.notFound')} /></View></Screen>;
  }
  return <ListingForm listing={data} />;
}
