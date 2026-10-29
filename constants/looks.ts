export type Look = 'frosted' | 'classic';
export const LOOKS: Look[] = ['frosted', 'classic'];

/**
 * Values for the `surface` and `line` colour variables (see constants/colors.js).
 * Classic is the flat, solid look. Frosted makes cards, fields and chips translucent glass over a soft gradient backdrop.
 */
export const LOOK_VARS: Record<Look, Record<string, string>> = {
  classic: {
    '--surface': '#FFFFFF',
    '--surface-dark': '#17211C',
    '--line': '#E3E8E5',
    '--line-dark': '#26332C',
  },
  frosted: {
    '--surface': 'rgba(255,255,255,0.62)',
    '--surface-dark': 'rgba(23,33,28,0.55)',
    '--line': 'rgba(255,255,255,0.8)',
    '--line-dark': 'rgba(255,255,255,0.1)',
  },
};
