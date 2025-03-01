import type { Theme } from '../../bases/Theme';
import light from './light';
export default {
  name: 'dark',
  displayName: 'Dark',
  themeExtends: [light],
  styles: {
    colors: {
      background: '#181818',
      scroll: '#999',
    },
    textColors: {
      heading: '#ffffff',
      link: 'rgb(70, 70, 200)',
      main: 'rgba(235, 235, 235, 0.64)',
    },
    hoverColors: {
      link: '#CCF 30%',
    },
  },
} as Partial<Theme>;
