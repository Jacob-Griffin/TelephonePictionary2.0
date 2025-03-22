import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { themeToString } from '../dist/bases/themeToString.js';
import light from '../dist/themes/builtin/light.js';
import dark from '../dist/themes/builtin/dark.js';
import applicationRuleText from '../dist/bases/applicationRuleText.js';
const content = `:root{${themeToString(light)}} @media(prefers-color-scheme:dark){:root{${themeToString(dark)}}} ${applicationRuleText}`;
const assetsDir = import.meta.dirname.replace('/generator', '/dist/assets/');
if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir);
}
writeFileSync(assetsDir + 'initial.css', content);
