import { brand } from './colors';

/** For props that can't take a className (icon colors, placeholder colors, status bar). */
export const Colors = {
  primary: brand[600],
  primaryDark: brand[700],
  accent: brand.gold,
  inactive: '#55645D',
  placeholder: '#9AA8A1',
} as const;

export const APP_NAME = 'Sell It Habibi!';

/** Public web address used in share links. Replace once the real domain exists. */
export const APP_URL = 'https://sellithabibi.app';
