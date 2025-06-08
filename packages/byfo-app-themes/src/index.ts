import { Theme } from './bases/Theme';
import { themes } from './themes';

export { CustomTheme, type CustomBackgroundType } from './bases/CustomTheme';
export type { Theme };
export * from './bases/ThemeSpec';
export * from './themes';
export { default as applicationRules, installRootStyles } from './bases/applicationRules';
export default themes;
