import { useWindowDimensions } from 'react-native';

export function useGridColumns(): number {
  const { width } = useWindowDimensions();
  if (width >= 1280) return 4;
  if (width >= 900) return 3;
  return 2;
}
