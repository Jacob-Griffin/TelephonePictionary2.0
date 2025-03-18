import sheetText from './applicationRuleText';

const sheet = new CSSStyleSheet();
sheet.replaceSync(sheetText);
export default sheet;
export const installRootStyles = (root: DocumentOrShadowRoot) => {
  if (root.adoptedStyleSheets.includes(sheet)) {
    return;
  }
  if (
    root === document &&
    window.getComputedStyle(document.documentElement).getPropertyValue('--byfo-theme-styles') === '#fff'
  ) {
    return;
  }
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
};
