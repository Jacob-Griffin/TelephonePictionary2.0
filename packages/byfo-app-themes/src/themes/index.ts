import light from './light';
import dark from './dark';
import classic from './classic';
import candyvomit from './candyvomit';
import type { Theme } from '../bases/Theme';
export type ThemeId = 'light' | 'dark' | 'classic' | 'candyvomit';
export const themes: Record<ThemeId, Theme> = {
  light,
  dark,
  classic,
  candyvomit,
};
export type ThemeMap = typeof themes;
