// Plain JS so tailwind.config.js can import it without a TS transform.
// Values come from the Family Expenses Tracker tokens (docs/SPEC.md section 2 in that repo), Forest theme.
// Light / dark pairs are exposed as `DEFAULT` and `dark`, used as `bg-surface dark:bg-surface-dark`.
module.exports = {
  // Brand and hero follow the chosen palette (constants/palettes.ts sets the variables).
  brand: {
    50: 'var(--brand-50)',
    100: 'var(--brand-100)',
    400: 'var(--brand-400)',
    500: 'var(--brand-500)',
    600: 'var(--brand-600)',
    700: 'var(--brand-700)',
    900: 'var(--brand-900)',
    gold: '#F2B84B',
  },
  // Canvas, surface and line follow the palette, the look and Pure black (constants/palettes.ts themeVars).
  canvas: { DEFAULT: 'var(--canvas)', dark: 'var(--canvas-dark)' },
  // Surface and line change with the look (Frosted / Classic), so they point at variables set in constants/looks.ts.
  surface: { DEFAULT: 'var(--surface)', dark: 'var(--surface-dark)' },
  line: { DEFAULT: 'var(--line)', dark: 'var(--line-dark)' },
  ink: { DEFAULT: 'var(--ink)', dark: 'var(--ink-dark)' },
  muted: { DEFAULT: 'var(--muted)', dark: 'var(--muted-dark)' },
  hero: { DEFAULT: 'var(--hero)', dark: 'var(--hero-dark)', track: 'var(--hero-track)', muted: 'var(--hero-muted)' },
  danger: { DEFAULT: '#B3261E', dark: '#F2B8B5' },
};
