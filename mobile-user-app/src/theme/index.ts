/**
 * Theme barrel — single import path.
 *
 * Uso típico:
 *   import { useTheme, tourismPalette } from '../theme';
 *   const { tokens, isDark, setMode } = useTheme();
 */
export {
  ThemeProvider,
  useTheme,
  useThemeTokens,
  type ThemeMode,
} from './ThemeProvider';

export {
  darkTokens,
  lightTokens,
  tourismPalette,
  type ThemeTokens,
  type TourismColor,
} from './tokens';
