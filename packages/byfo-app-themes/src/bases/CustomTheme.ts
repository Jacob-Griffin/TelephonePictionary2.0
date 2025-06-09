import { installRootStyles } from './applicationRules';
import { CustomThemeBase } from './CustomThemeBase';

export type CustomBackgroundType = 'none' | 'image' | 'color';
export class CustomTheme extends CustomThemeBase {
  #backgroundBrightness: number;
  #backgroundSaturation: number;
  #backgroundBlur: number;
  #backgroundType: CustomBackgroundType;
  #customBackground?: string;
  constructor({
    backgroundBrightness,
    backgroundSaturation,
    backgroundBlur,
    backgroundType,
    customBackground: customColor,
  }: Partial<CustomTheme> = {}) {
    super();
    this.#backgroundBlur = backgroundBlur ?? CustomThemeBase.defaultBlur;
    this.#backgroundBrightness = backgroundBrightness ?? CustomThemeBase.defaultBrightness;
    this.#backgroundSaturation = backgroundSaturation ?? CustomThemeBase.defaultSaturation;
    this.#backgroundType = backgroundType ?? 'none';
    this.#customBackground = customColor;
  }
  static fromJsonString(v?: string) {
    const json = v ? JSON.parse(v) : {};
    return new CustomTheme(json);
  }
  toJsonString(): string {
    const { backgroundBrightness, backgroundSaturation, backgroundBlur, backgroundType, customBackground } =
      this;
    const obj: Partial<CustomTheme> = {
      backgroundBrightness,
      backgroundSaturation,
      backgroundBlur,
      backgroundType,
      customBackground,
    };
    return JSON.stringify(obj);
  }

  reset() {
    this.backgroundBlur = CustomThemeBase.defaultBlur;
    this.backgroundBrightness = CustomThemeBase.defaultBrightness;
    this.backgroundSaturation = CustomThemeBase.defaultSaturation;
    this.refreshStylesheet();
  }

  set backgroundBrightness(v: number) {
    this.#backgroundBrightness = clamp(v, CustomThemeBase.minBrightness, CustomThemeBase.maxBrightness);
    this.refreshStylesheet();
  }
  get backgroundBrightness() {
    return this.#backgroundBrightness;
  }

  set backgroundSaturation(v: number) {
    this.#backgroundSaturation = clamp(v, CustomThemeBase.minSaturation, CustomThemeBase.maxSaturation);
    this.refreshStylesheet();
  }
  get backgroundSaturation() {
    return this.#backgroundSaturation;
  }

  set backgroundBlur(v: number) {
    this.#backgroundBlur = clamp(v, CustomThemeBase.minBlur, CustomThemeBase.maxBlur);
    this.refreshStylesheet();
  }
  get backgroundBlur() {
    return this.#backgroundBlur;
  }

  set backgroundType(v: CustomBackgroundType) {
    this.#backgroundType = v ?? 'none';
    this.refreshStylesheet();
  }
  get backgroundType() {
    return this.#backgroundType;
  }

  set customBackground(v: string | undefined) {
    this.#customBackground = v;
    this.refreshStylesheet();
  }
  get customBackground() {
    return this.#customBackground;
  }

  toString(): string {
    let backgroundString = '';
    switch (this.backgroundType) {
      case 'color':
        backgroundString = `--byfo-custom-background-color:#${this.customBackground};`;
        break;
      case 'image':
        backgroundString = `--byfo-custom-background-image:url("${this.customBackground ?? ''}");`;
        break;
    }
    return `:root { 
    --byfo-custom-brightness: ${this.#backgroundBrightness};
    --byfo-custom-saturation: ${this.#backgroundSaturation};
    --byfo-custom-blur: ${this.#backgroundBlur}px;
    ${backgroundString}
    }`;
  }

  _sheet = new CSSStyleSheet();
  refreshStylesheet() {
    this._sheet.replaceSync(this.toString());
  }

  install() {
    installRootStyles(document);
    this.refreshStylesheet();
    if (document.adoptedStyleSheets.includes(this._sheet)) {
      return;
    }
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, this._sheet];
  }
}

function clamp(v: number, min: number, max: number) {
  if (v > max) return max;
  if (v < min) return min;
  return v;
}
