// Colour themes from the Family Expenses app (lib/core/theme/color_themes.dart there): same ten themes, same values,
// same way of tinting the page, cards, edges and text with each theme's hue. Keep the two in step.

export type PaletteId = 'forest' | 'ocean' | 'sunset' | 'graphite' | 'lavender' | 'rose' | 'lagoon' | 'indigo' | 'mocha' | 'citrus';
export const PALETTE_IDS: PaletteId[] = ['forest', 'ocean', 'sunset', 'graphite', 'lavender', 'rose', 'lagoon', 'indigo', 'mocha', 'citrus'];

/** Light, dark, and pure black (dark with true-black pages and header). */
export type Variant = 'light' | 'dark' | 'pure';

type ThemeColors = { primary: string; hero: string; heroTrack: string; navActiveBackground: string; navActiveText: string };
type Theme = {
  /** Hero swatches: `hero` sets the hue that tints the whole theme; `accent` is the highlight colour. */
  preview: { hero: string; accent: string; track: string };
  /** Header gradient in light mode (dark and pure darken it). */
  header: [string, string];
  light: ThemeColors;
  dark: ThemeColors;
  pure: ThemeColors;
};

const THEMES: Record<PaletteId, Theme> = {
  forest: {
    preview: { hero: '#0B3D2E', accent: '#F2B84B', track: '#1F5A47' },
    header: ['#1B6FA8', '#1E9577'],
    light: { primary: '#0B6E4F', hero: '#0B3D2E', heroTrack: '#1F5A47', navActiveBackground: '#DCEFE6', navActiveText: '#0B3D2E' },
    dark: { primary: '#4CC38A', hero: '#123F31', heroTrack: '#2A6150', navActiveBackground: '#1F3A30', navActiveText: '#4CC38A' },
    pure: { primary: '#4CC38A', hero: '#0B2E23', heroTrack: '#1F5A47', navActiveBackground: '#0F2A21', navActiveText: '#4CC38A' },
  },
  ocean: {
    preview: { hero: '#0B2F4E', accent: '#F28C28', track: '#1B4F7A' },
    header: ['#1B6FA8', '#3B4CCA'],
    light: { primary: '#1B6FA8', hero: '#0B2F4E', heroTrack: '#1B4F7A', navActiveBackground: '#DCEAF5', navActiveText: '#0B2F4E' },
    dark: { primary: '#6FB3D9', hero: '#12395C', heroTrack: '#28608F', navActiveBackground: '#1D3550', navActiveText: '#6FB3D9' },
    pure: { primary: '#6FB3D9', hero: '#08243C', heroTrack: '#1B4F7A', navActiveBackground: '#0E2338', navActiveText: '#6FB3D9' },
  },
  sunset: {
    preview: { hero: '#4A1F1A', accent: '#F2B84B', track: '#7A3329' },
    header: ['#D9692E', '#B8432F'],
    light: { primary: '#B2452D', hero: '#4A1F1A', heroTrack: '#7A3329', navActiveBackground: '#F6E3DD', navActiveText: '#4A1F1A' },
    dark: { primary: '#F0997F', hero: '#5A2720', heroTrack: '#8A4034', navActiveBackground: '#4A2A24', navActiveText: '#F0997F' },
    pure: { primary: '#F0997F', hero: '#381714', heroTrack: '#7A3329', navActiveBackground: '#2A1512', navActiveText: '#F0997F' },
  },
  graphite: {
    preview: { hero: '#161B1F', accent: '#6FB3D9', track: '#3D4852' },
    header: ['#2F3A43', '#3A6E8F'],
    light: { primary: '#2F3A43', hero: '#161B1F', heroTrack: '#3D4852', navActiveBackground: '#E3E8EB', navActiveText: '#161B1F' },
    dark: { primary: '#6FB3D9', hero: '#1E252A', heroTrack: '#4A5560', navActiveBackground: '#2A343B', navActiveText: '#6FB3D9' },
    pure: { primary: '#6FB3D9', hero: '#0F1417', heroTrack: '#3D4852', navActiveBackground: '#1A2126', navActiveText: '#6FB3D9' },
  },
  lavender: {
    preview: { hero: '#2E2058', accent: '#F2B84B', track: '#4A3A85' },
    header: ['#6B4FBB', '#C2335F'],
    light: { primary: '#6B4FBB', hero: '#2E2058', heroTrack: '#4A3A85', navActiveBackground: '#E8E2F7', navActiveText: '#2E2058' },
    dark: { primary: '#A99BFF', hero: '#33276A', heroTrack: '#5A4A9E', navActiveBackground: '#2A2448', navActiveText: '#A99BFF' },
    pure: { primary: '#A99BFF', hero: '#1F1740', heroTrack: '#5A4A9E', navActiveBackground: '#19162B', navActiveText: '#A99BFF' },
  },
  rose: {
    preview: { hero: '#4A1530', accent: '#F5C96B', track: '#7A2A52' },
    header: ['#C2335F', '#8A2A6E'],
    light: { primary: '#C2335F', hero: '#4A1530', heroTrack: '#7A2A52', navActiveBackground: '#F9E0E8', navActiveText: '#4A1530' },
    dark: { primary: '#F58AAE', hero: '#5A1D3B', heroTrack: '#8A3A5E', navActiveBackground: '#3A1F2C', navActiveText: '#F58AAE' },
    pure: { primary: '#F58AAE', hero: '#361123', heroTrack: '#8A3A5E', navActiveBackground: '#23131A', navActiveText: '#F58AAE' },
  },
  lagoon: {
    preview: { hero: '#0A3A40', accent: '#FF9F6B', track: '#1D5A62' },
    header: ['#0E7C86', '#1E9577'],
    light: { primary: '#0E7C86', hero: '#0A3A40', heroTrack: '#1D5A62', navActiveBackground: '#D8EEF0', navActiveText: '#0A3A40' },
    dark: { primary: '#4FD1D9', hero: '#0F434A', heroTrack: '#247079', navActiveBackground: '#1B3A3E', navActiveText: '#4FD1D9' },
    pure: { primary: '#4FD1D9', hero: '#09282C', heroTrack: '#247079', navActiveBackground: '#102325', navActiveText: '#4FD1D9' },
  },
  indigo: {
    preview: { hero: '#141C4A', accent: '#FFC857', track: '#2C3A8A' },
    header: ['#3B4CCA', '#6B4FBB'],
    light: { primary: '#3B4CCA', hero: '#141C4A', heroTrack: '#2C3A8A', navActiveBackground: '#E0E4F8', navActiveText: '#141C4A' },
    dark: { primary: '#8C9BFF', hero: '#1B2560', heroTrack: '#36479E', navActiveBackground: '#222A55', navActiveText: '#8C9BFF' },
    pure: { primary: '#8C9BFF', hero: '#10163A', heroTrack: '#36479E', navActiveBackground: '#141933', navActiveText: '#8C9BFF' },
  },
  mocha: {
    preview: { hero: '#3A261B', accent: '#E8B04B', track: '#5C4030' },
    header: ['#8A5A3B', '#B07A2E'],
    light: { primary: '#8A5A3B', hero: '#3A261B', heroTrack: '#5C4030', navActiveBackground: '#F1E4DA', navActiveText: '#3A261B' },
    dark: { primary: '#D9A07A', hero: '#45302A', heroTrack: '#6B4C3C', navActiveBackground: '#33261F', navActiveText: '#D9A07A' },
    pure: { primary: '#D9A07A', hero: '#291D19', heroTrack: '#6B4C3C', navActiveBackground: '#1F1713', navActiveText: '#D9A07A' },
  },
  citrus: {
    preview: { hero: '#2A3A0A', accent: '#FF8A3D', track: '#475E12' },
    header: ['#5C7F0B', '#2E8B57'],
    light: { primary: '#5C7F0B', hero: '#2A3A0A', heroTrack: '#475E12', navActiveBackground: '#E6EFCB', navActiveText: '#2A3A0A' },
    dark: { primary: '#A8D44A', hero: '#324410', heroTrack: '#52701C', navActiveBackground: '#263311', navActiveText: '#A8D44A' },
    pure: { primary: '#A8D44A', hero: '#1E290A', heroTrack: '#52701C', navActiveBackground: '#171F0A', navActiveText: '#A8D44A' },
  },
};

// ---- the part of a mode that does not depend on the theme, before tinting
type ModeBase = { background: string; surface: string; border: string; text: string; muted: string; navRail: string };
const MODE_BASES: Record<Variant, ModeBase> = {
  light: { background: '#F4F6F5', surface: '#FFFFFF', border: '#E3E8E5', text: '#0F1F1A', muted: '#55645D', navRail: '#FFFFFF' },
  dark: { background: '#0E1512', surface: '#17211C', border: '#26332C', text: '#E8F0EC', muted: '#9DB0A6', navRail: '#17211C' },
  pure: { background: '#000000', surface: '#0A0F0D', border: '#1F2B26', text: '#F2F7F4', muted: '#9DB0A6', navRail: '#000000' },
};

// ---- HSL helpers (same maths as Flutter's HSLColor)
type Hsl = { h: number; s: number; l: number };
function toHsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? (((g - b) / d) % 6) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return { h: (h + 360) % 360, s, l };
}
function fromHsl({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Give a colour the theme's hue; a near-grey colour gets at least `minSat` first so the tint shows. */
function retint(color: string, hue: number, satScale: number, minSat = 0, light?: number): string {
  const c = toHsl(color);
  return fromHsl({ h: hue, s: Math.min(1, Math.max(0, Math.max(c.s, minSat) * satScale)), l: light ?? c.l });
}

export type Tokens = ThemeColors & { background: string; surface: string; border: string; text: string; muted: string; navRail: string; ringAccent: string };

/** Every colour the app needs for a theme and variant. Forest is left untinted (it is the original green-grey). */
export function tokensFor(id: PaletteId, variant: Variant): Tokens {
  const theme = THEMES[id];
  const b = MODE_BASES[variant];
  const colors = theme[variant];
  let base = b;
  if (id !== 'forest') {
    const hero = toHsl(theme.preview.hero);
    const scale = Math.min(1, Math.max(0, hero.s / 0.69)); // a grey theme (Graphite) stays nearly colourless
    const light = variant === 'light';
    const pure = variant === 'pure';
    const t = (c: string, minSat = 0, l?: number) => retint(c, hero.h, scale, minSat, l);
    base = {
      background: t(b.background, light ? 0.4 : 0.42),
      surface: t(b.surface, light ? 0.7 : 0.5, light ? 0.985 : undefined),
      border: t(b.border, 0.4),
      text: t(b.text, 0.2),
      muted: t(b.muted, 0.12),
      navRail: t(b.navRail, pure ? 0 : light ? 0.7 : 0.5, light ? 0.985 : undefined),
    };
  }
  return { ...colors, ...base, ringAccent: theme.preview.accent };
}

/** The header gradient. Dark darkens each end towards black; pure black is plain black. */
export function headerGradient(id: PaletteId, variant: Variant): [string, string] {
  const [a, b] = THEMES[id].header;
  if (variant === 'light') return [a, b];
  if (variant === 'pure') return ['#000000', '#000000'];
  return [mixHex(a, '#000000', 0.35), mixHex(b, '#000000', 0.35)];
}

/** The two header colours and the accent, always the light-mode ones: the backdrop patches are made from these. */
export function backdropSource(id: PaletteId) {
  return { a: THEMES[id].header[0], b: THEMES[id].header[1], accent: THEMES[id].preview.accent };
}

export const paletteSwatch = (id: PaletteId) => THEMES[id].light.primary;

/** The three colours on a theme card in Settings: card background, highlight bar and track bar. */
export const palettePreview = (id: PaletteId) => THEMES[id].preview;

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * CSS variables for a theme, look and dark variant (names match constants/colors.js).
 * `dark` is the variant used when the phone is in dark mode: `dark` or `pure` (Pure black appearance).
 */
export function themeVars(id: PaletteId, look: 'frosted' | 'classic', dark: Exclude<Variant, 'light'>): Record<string, string> {
  const L = tokensFor(id, 'light');
  const D = tokensFor(id, dark);
  const frosted = look === 'frosted';
  // Glass cards: a see-through tint of the surface (0.64 light, 0.58 dark) with a thin light edge, as in the expenses app.
  const surfaceLight = frosted ? rgba(L.surface, 0.64) : L.surface;
  const surfaceDark = frosted ? rgba(D.surface, 0.58) : D.surface;
  return {
    '--canvas': L.background,
    '--canvas-dark': D.background,
    '--surface': surfaceLight,
    '--surface-dark': surfaceDark,
    '--line': frosted ? 'rgba(255,255,255,0.55)' : L.border,
    '--line-dark': frosted ? 'rgba(255,255,255,0.16)' : D.border,
    '--ink': L.text,
    '--ink-dark': D.text,
    '--muted': L.muted,
    '--muted-dark': D.muted,
    '--brand-50': L.navActiveBackground,
    '--brand-100': mixHex(L.navActiveBackground, '#FFFFFF', 0.5),
    '--brand-400': D.primary,
    '--brand-500': D.primary,
    '--brand-600': L.primary,
    '--brand-700': L.navActiveText,
    '--brand-900': L.hero,
    '--hero': L.hero,
    '--hero-dark': D.navActiveBackground,
    '--hero-track': D.heroTrack,
    '--hero-muted': '#BFD8CC',
  };
}

let active: { id: PaletteId; variant: Variant } = { id: 'forest', variant: 'light' };
/** Remember which theme is showing, for the few places that need a colour in code (icons, the header gradient). */
export const setActiveTheme = (id: PaletteId, variant: Variant) => {
  active = { id, variant };
};
export const activeTokens = () => tokensFor(active.id, active.variant);
export const activeHeader = () => headerGradient(active.id, active.variant);
export const activeVariant = () => active.variant;
export const activePaletteId = () => active.id;
