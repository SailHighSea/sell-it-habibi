import { activeTokens } from './palettes';

/** For props that can't take a className (icon colors, placeholder colors, status bar). */
export const Colors = {
  // Theme-dependent values are read when used; the app remounts its screens when the theme changes.
  get primary() {
    return activeTokens().primary;
  },
  get primaryDark() {
    return activeTokens().hero;
  },
  accent: '#F2B84B',
  inactive: '#55645D',
  placeholder: '#9AA8A1',
} as const;

export const APP_NAME = 'Sell It Habibi!';

/** Public web address used in share links. Replace once the real domain exists. */
export const APP_URL = 'https://sellithabibi.app';
