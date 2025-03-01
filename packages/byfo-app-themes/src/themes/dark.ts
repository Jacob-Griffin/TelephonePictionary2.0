import { Theme } from '../bases/Theme';
import { light } from './light';
import jsonDark from './builtin/dark';
export const dark = new Theme(jsonDark);

export default light;

declare global {
  interface ThemeMap {
    dark: typeof dark;
  }
}
