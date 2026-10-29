export type PaletteId = 'forest' | 'ocean' | 'sunset' | 'royal';
export const PALETTE_IDS: PaletteId[] = ['forest', 'ocean', 'sunset', 'royal'];

type Palette = {
  /** Swatch shown in Settings. */
  swatch: string;
  brand: { 50: string; 100: string; 400: string; 500: string; 600: string; 700: string; 900: string };
  hero: { DEFAULT: string; dark: string; track: string; muted: string };
  /** Header gradient, light then dark mode. */
  header: { light: [string, string]; dark: [string, string] };
  /** Frosted backdrop wash (three stops) and glow, light then dark mode. */
  wash: { light: [string, string, string]; dark: [string, string, string] };
  glow: { light: string; dark: string };
};

/** Forest is the Family Expenses Tracker theme; the others reuse its structure with a different hue. */
export const PALETTES: Record<PaletteId, Palette> = {
  forest: {
    swatch: '#0B6E4F',
    brand: { 50: '#DCEFE6', 100: '#E7F2EC', 400: '#4CC38A', 500: '#4CC38A', 600: '#0B6E4F', 700: '#0B3D2E', 900: '#0B3D2E' },
    hero: { DEFAULT: '#0B3D2E', dark: '#123F31', track: '#1F5A47', muted: '#BFD8CC' },
    header: { light: ['#1D6FA6', '#1F9A78'], dark: ['#15496F', '#17664F'] },
    wash: { light: ['#D9EFE5', '#F1F6F4', '#DCEAF5'], dark: ['#0F2A21', '#0E1512', '#0F1D2B'] },
    glow: { light: 'rgba(242,184,75,0.28)', dark: 'rgba(76,195,138,0.16)' },
  },
  ocean: {
    swatch: '#1565A8',
    brand: { 50: '#DCEBF7', 100: '#E7F0F8', 400: '#5AB0F0', 500: '#5AB0F0', 600: '#1565A8', 700: '#0B3D66', 900: '#0B3D66' },
    hero: { DEFAULT: '#0B3D66', dark: '#123A58', track: '#1F5A85', muted: '#BFD4E6' },
    header: { light: ['#1565A8', '#2AA5C9'], dark: ['#0F3F6B', '#17789A'] },
    wash: { light: ['#D6E8F7', '#F1F5F8', '#D8F0F2'], dark: ['#0E2236', '#0D1419', '#0E2B2E'] },
    glow: { light: 'rgba(90,176,240,0.28)', dark: 'rgba(90,176,240,0.16)' },
  },
  sunset: {
    swatch: '#C2501B',
    brand: { 50: '#FBE6D9', 100: '#FCEEE4', 400: '#F59A5B', 500: '#F59A5B', 600: '#C2501B', 700: '#6B2A0B', 900: '#6B2A0B' },
    hero: { DEFAULT: '#6B2A0B', dark: '#4A2512', track: '#8A3E1B', muted: '#E8CDBB' },
    header: { light: ['#D9531E', '#E8A33A'], dark: ['#8F3A12', '#A8741F'] },
    wash: { light: ['#FBE3D3', '#F8F4F1', '#FBEBC9'], dark: ['#2A150B', '#15110E', '#2A200B'] },
    glow: { light: 'rgba(217,83,30,0.2)', dark: 'rgba(245,154,91,0.16)' },
  },
  royal: {
    swatch: '#5B3FB5',
    brand: { 50: '#E8E1F6', 100: '#EFEAF8', 400: '#A78BFA', 500: '#A78BFA', 600: '#5B3FB5', 700: '#2E1C66', 900: '#2E1C66' },
    hero: { DEFAULT: '#2E1C66', dark: '#2A2150', track: '#4A3590', muted: '#CFC6EA' },
    header: { light: ['#5B3FB5', '#B04FA8'], dark: ['#3C2A7A', '#7A357A'] },
    wash: { light: ['#E4DBF6', '#F4F2F8', '#F3DCEE'], dark: ['#1B1233', '#120F18', '#2A1229'] },
    glow: { light: 'rgba(176,79,168,0.22)', dark: 'rgba(167,139,250,0.16)' },
  },
};

/** CSS variables for a palette (names match constants/colors.js). */
export function paletteVars(id: PaletteId): Record<string, string> {
  const p = PALETTES[id];
  return {
    '--brand-50': p.brand[50],
    '--brand-100': p.brand[100],
    '--brand-400': p.brand[400],
    '--brand-500': p.brand[500],
    '--brand-600': p.brand[600],
    '--brand-700': p.brand[700],
    '--brand-900': p.brand[900],
    '--hero': p.hero.DEFAULT,
    '--hero-dark': p.hero.dark,
    '--hero-track': p.hero.track,
    '--hero-muted': p.hero.muted,
  };
}

let active: PaletteId = 'forest';
export const setActivePalette = (id: PaletteId) => {
  active = id;
};
export const activePalette = () => PALETTES[active];
