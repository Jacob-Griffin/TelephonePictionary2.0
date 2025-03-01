import { readdirSync, writeFileSync } from 'fs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = query => new Promise(resolve => rl.question(query, resolve));

const displayName = process.argv[2] ?? (await prompt('Theme "pretty" name (ex: My Theme): '));
if (!displayName) {
  throw new Error('No theme name provided');
}
const isDark = (await prompt('Is this a "dark" theme? (y/[N])')) ?? 'n';
const extension = isDark.toLowerCase().startsWith('y') ? 'dark' : 'light';
console.log(`Creating theme "${displayName}"...`);
const themeName = displayName.toLowerCase().replaceAll(/[^a-z]/g, '');
if (readdirSync('./src/themes').includes(themeName + '.ts')) {
  throw new Error('Theme already exists');
}

const themeContents = `import { Theme } from '../bases/Theme';
import { ${extension} } from './${extension}';

export const ${themeName} = new Theme({
  name: '${themeName}',
  displayName: '${displayName}',
  themeExtends: [${extension}],
  // Colors can take any valid css <color> string
  // If a color is uncommented, you can hover over the label to see what they're for (depending on IDE, vscode supports this)
  // If a color is not defined, it will simply fall back to the "base" theme's color
  styles: {
    colors: {
      // active: 'white',
      // brand: 'white',
      // background: 'white',
      // backdrop: 'white',
      // border: 'white',
      // button: 'white',
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
    },
  },
});

export default ${themeName};

declare global {
  interface ThemeMap {
    ${themeName}: typeof ${themeName};
  }
}
`;

writeFileSync(`./src/themes/${themeName}.ts`, themeContents);

const themeList = readdirSync('./src/themes').map(filename => filename.replace('.ts', ''));

const indexContents = `import { Theme } from './bases/Theme';
${themeList.map(theme => `import { ${theme} } from './themes/${theme}';`).join('\n')}

const themes: Record<ThemeId, Theme> = {
${themeList.map(theme => `  ${theme},`).join('\n')}
};

export { CustomTheme } from './bases/CustomTheme';
export type { ThemeId, Theme };
export * from './bases/ThemeSpec';
export * from './bases/ThemeId';
export { themes };
export { default as applicationRules, installRootStyles } from './bases/applicationRules';
export default themes;
`;

writeFileSync(`./src/index.ts`, indexContents);

console.log('Done!');
rl.close();
