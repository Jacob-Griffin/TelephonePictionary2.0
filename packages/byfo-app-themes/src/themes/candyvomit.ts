import { Theme } from '../bases/Theme';
import { light } from './light';

export const candyvomit = new Theme({
  name: 'candyvomit',
  displayName: 'Candy Vomit',
  themeExtends: [light],
  // Colors can take any valid css <color> string
  // If a color is uncommented, you can hover over the label to see what they're for (depending on IDE, vscode supports this)
  // If a color is not defined, it will simply fall back to the "base" theme's color
  styles: {
    colors: {
      active: '#8a43db',
      brand: '#f42f65',
      // background: 'white',
      // backdrop: 'white',
      // border: 'white',
      // button: 'white',
      // disabled: 'white',
      important: '#ff9900',
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
      icon: "url('/byfo-logo2.png')",
      // 'small-icon': "url('/example.png')",
      background: "url('/candyCarnival-bkgd.jpg')",
    },
  },
});

export default candyvomit;
