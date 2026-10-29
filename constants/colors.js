// Plain JS so tailwind.config.js can import it without a TS transform.
// Values come from the Family Expenses Tracker tokens (docs/SPEC.md section 2 in that repo), Forest theme.
// Light / dark pairs are exposed as `DEFAULT` and `dark`, used as `bg-surface dark:bg-surface-dark`.
module.exports = {
  brand: {
    50: '#DCEFE6',
    100: '#E7F2EC',
    400: '#4CC38A',
    500: '#4CC38A',
    600: '#0B6E4F',
    700: '#0B3D2E',
    900: '#0B3D2E',
    gold: '#F2B84B',
  },
  canvas: { DEFAULT: '#F4F6F5', dark: '#0E1512' },
  // Surface and line change with the look (Frosted / Classic), so they point at variables set in constants/looks.ts.
  surface: { DEFAULT: 'var(--surface)', dark: 'var(--surface-dark)' },
  line: { DEFAULT: 'var(--line)', dark: 'var(--line-dark)' },
  ink: { DEFAULT: '#0F1F1A', dark: '#E8F0EC' },
  muted: { DEFAULT: '#55645D', dark: '#9DB0A6' },
  hero: { DEFAULT: '#0B3D2E', dark: '#123F31', track: '#1F5A47', muted: '#BFD8CC' },
  danger: { DEFAULT: '#B3261E', dark: '#F2B8B5' },
};
