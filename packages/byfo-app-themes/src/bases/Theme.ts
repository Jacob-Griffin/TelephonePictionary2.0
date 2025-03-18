import { installRootStyles } from './applicationRules';
import { themeToString } from './themeToString';

export class Theme {
  name: ThemeId;
  displayName: string;
  styles: {
    /**
     * Contains solid colors used in shapes and backgrounds
     * @see ThemeColors
     */
    colors?: Partial<ThemeColors>;
    /**
     * Contains text color for various states
     */
    textColors?: Partial<ThemeTextColors>;
    /**
     * Contains color offsets to be mixed with their base color when hovered
     */
    hoverColors?: Partial<ThemeHoverColors>;
    /**
     * Contains urls pointing to images related to the theme
     */
    images?: Partial<ThemeImages>;
  };
  isDefault?: boolean;
  themeExtends?: Theme[];

  constructor({ name, displayName, styles, isDefault, themeExtends }: Partial<Theme>) {
    if (!name) {
      throw new Error('Theme requires a name');
    }
    this.name = name;
    this.displayName = displayName ?? name!.toLowerCase();
    this.isDefault = isDefault === true;
    this.styles = Object.assign({}, styles);
    this.themeExtends = themeExtends ?? [];
  }

  _sheet = new CSSStyleSheet();
  loadStylesheet() {
    this._sheet.replaceSync(this.toString());
  }
  toString() {
    const selector = this.isDefault ? '' : `[byfo-theme-${this.name}]`;
    return `:root${selector} {${themeToString(this)}}`;
  }
  install() {
    installRootStyles(document);
    this.loadStylesheet();
    if (document.adoptedStyleSheets.includes(this._sheet)) {
      // Since it's all by reference, this should work to prevent duplicate sheets
      return;
    }
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, this._sheet];
  }
  apply() {
    const attributes = document.documentElement
      .getAttributeNames()
      .filter(name => name.startsWith('byfo-theme'));
    for (const themetag of attributes) {
      document.documentElement.removeAttribute(themetag);
    }
    document.documentElement.setAttribute(`byfo-theme-${this.name}`, '');
  }
}

declare global {
  interface Window {
    backgroundSheet: CSSStyleSheet;
  }
}
