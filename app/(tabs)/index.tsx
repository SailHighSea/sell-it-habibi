import { useEffect, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/ui/listing-card';
import { useGridColumns } from '@/hooks/use-grid-columns';
import { CATEGORIES, fetchListings, type Listing } from '@/services/listings';

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const columns = useGridColumns();

  useEffect(() => {
    fetchListings().then(setListings);
  }, []);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50 dark:bg-slate-900">
      <FlatList
        key={columns} // numColumns can't change on a mounted list
        data={listings}
        numColumns={columns}
        keyExtractor={(l) => l.id}
        contentContainerClassName="gap-3 p-4"
        columnWrapperClassName="gap-3"
        ListHeaderComponent={
          <View className="mb-1 gap-3">
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">Fresh finds near you</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {CATEGORIES.map((c) => (
                <View key={c} className="rounded-full border border-brand-100 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <Text className="text-sm font-medium text-brand-700 dark:text-brand-500">{c}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <ListingCard listing={item} />}
      />
    </SafeAreaView>
  );
}
