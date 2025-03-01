import { installRootStyles } from './applicationRules';
import { CustomThemeBase } from './CustomThemeBase';

export class CustomTheme extends CustomThemeBase {
  #backgroundBrightness: number;
  #backgroundSaturation: number;
  #backgroundBlur: number;
  constructor({ backgroundBrightness, backgroundSaturation, backgroundBlur }: Partial<CustomTheme> = {}) {
    super();
    this.#backgroundBlur = backgroundBlur ?? CustomThemeBase.defaultBlur;
    this.#backgroundBrightness = backgroundBrightness ?? CustomThemeBase.defaultBrightness;
    this.#backgroundSaturation = backgroundSaturation ?? CustomThemeBase.defaultSaturation;
  }
  static fromJsonString(v?: string) {
    const json = v ? JSON.parse(v) : {};
    return new CustomTheme(json);
  }
  toJsonString(): string {
    const { backgroundBrightness, backgroundSaturation, backgroundBlur } = this;
    return JSON.stringify({ backgroundBrightness, backgroundSaturation, backgroundBlur });
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

  toString(): string {
    return `:root { 
    --byfo-custom-brightness: ${this.#backgroundBrightness};
    --byfo-custom-saturation: ${this.#backgroundSaturation};
    --byfo-custom-blur: ${this.#backgroundBlur}px;
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
