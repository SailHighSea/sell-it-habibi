import { useColorScheme } from 'nativewind';

/** True when the app is showing its dark theme (the system setting unless Settings overrides it). */
export function useIsDark(): boolean {
  return useColorScheme().colorScheme === 'dark';
}
