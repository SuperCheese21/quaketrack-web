// Curated set of DaisyUI themes offered by the theme selector. Keep in sync
// with the `themes:` list in index.css (a theme must be enabled there to work).
export interface ThemeOption {
  id: string;
  label: string;
  // Whether this is a dark theme — drives the dark map basemap, etc.
  dark: boolean;
}

export const THEMES: ThemeOption[] = [
  { id: 'light', label: 'Light', dark: false },
  { id: 'emerald', label: 'Emerald', dark: false },
  { id: 'cyberpunk', label: 'Cyberpunk', dark: false },
  { id: 'dark', label: 'Dark', dark: true },
  { id: 'night', label: 'Night', dark: true },
  { id: 'forest', label: 'Forest', dark: true },
  { id: 'synthwave', label: 'Synthwave', dark: true },
  { id: 'dracula', label: 'Dracula', dark: true },
  { id: 'abyss', label: 'Abyss', dark: true },
];

export const DARK_THEME_IDS = new Set(
  THEMES.filter((t) => t.dark).map((t) => t.id),
);

// Default to a dark theme so the darker basemap is the out-of-the-box look.
export const DEFAULT_THEME = 'dark';
