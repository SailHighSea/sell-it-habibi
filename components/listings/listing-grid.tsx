import type { ReactElement } from 'react';
import { FlatList } from 'react-native';

import { useBarInset } from '@/hooks/use-bar-inset';
import { useGridColumns } from '@/hooks/use-grid-columns';
import type { Listing } from '@/lib/listing-types';

import { ListingCard } from './listing-card';

type Props = {
  data: Listing[];
  header?: ReactElement;
  empty?: ReactElement | null;
  /** Extra bottom padding so the last row clears the floating tab bar (tab screens only). */
  underBar?: boolean;
};

/** Responsive grid shared by Home, Search, Favourites and seller pages. The header spans the full width. */
export function ListingGrid({ data, header, empty, underBar }: Props) {
  const columns = useGridColumns();
  const inset = useBarInset();
  return (
    <FlatList
      key={columns} // numColumns can't change on a mounted list
      data={data}
      numColumns={columns}
      keyExtractor={(l) => l.id}
      contentContainerClassName="gap-3 px-4 pb-6"
      contentContainerStyle={underBar ? { paddingBottom: inset } : undefined}
      columnWrapperClassName="gap-3"
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      renderItem={({ item }) => <ListingCard listing={item} />}
    />
  );
}
