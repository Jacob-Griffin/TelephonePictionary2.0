import { Theme } from '../bases/Theme';
import { light } from './light';

export const classic = new Theme({
  name: 'classic',
  displayName: 'Classic',
  themeExtends: [light],
  // Colors can take any valid css <color> string
  // If a color is uncommented, you can hover over the label to see what they're for (depending on IDE, vscode supports this)
  // If a color is not defined, it will simply fall back to the "base" theme's color
  styles: {
    colors: {
      active: '#8cc63f',
      brand: '#2c33bf',
      // background: 'white',
      // backdrop: 'white',
      // border: 'white',
      // button: 'var(--color-brand)',
      // disabled: 'white',
      // important: 'white',
      // scroll: 'white',
      // toggle: 'white',
    },
    textColors: {
      // active: 'black',
      // backdrop: 'black',
      // button: 'black',
      // heading: 'black',
      // main: 'black',
      // link: 'black',
    },
    hoverColors: {
      // link: 'red',
      // button: 'red',
    },
    images: {
      // 'icon': "url('/example.png')",
      // 'small-icon': "url('/example.png')",
      background: "url('/basic-bkgd.jpg')",
    },
  },
});

export default classic;

declare global {
  interface ThemeMap {
    classic: typeof classic;
  }
}
