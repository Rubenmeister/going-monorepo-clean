export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

export interface ThemeConfig {
  initialMode?: ThemeMode;
  storageKey?: string;
  colorScheme?: 'light' | 'dark';
}
