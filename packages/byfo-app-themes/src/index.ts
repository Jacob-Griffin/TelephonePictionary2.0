import { Theme } from './bases/Theme';
import { candyvomit } from './themes/candyvomit';
import { classic } from './themes/classic';
import { dark } from './themes/dark';
import { light } from './themes/light';

const themes: Record<ThemeId, Theme> = {
  candyvomit,
  classic,
  dark,
  light,
};

export { CustomTheme } from './bases/CustomTheme';
export type { ThemeId, Theme };
export * from './bases/ThemeSpec';
export * from './bases/ThemeId';
export { themes };
export { default as applicationRules, installRootStyles } from './bases/applicationRules';
export default themes;
