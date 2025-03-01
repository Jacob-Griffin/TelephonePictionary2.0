import { LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';
import { customElement } from '../utils/byfoCustomElement.ts';
import { map } from 'lit/directives/map.js';
import { html } from '../utils/byfoHtml';

import buttonStyles from '../styles/button.style.ts';
import { applicationRules, CustomTheme, ThemeId, themes } from '@byfo/themes';
import { BYFOStore } from 'byfo-utils';
import { createRef, ref, Ref } from 'lit/directives/ref.js';

@customElement('byfo-settings')
export default class BYFOSettings extends LitElement {
  @property() store?: BYFOStore;
  get customTheme() {
    return this.store?.customStyle;
  }

  #themeKeys?: ThemeId[];

  themeChanged(e: InputEvent) {
    if (!this.store) {
      return;
    }
    const themeid = (e.target as HTMLSelectElement).value as ThemeId;
    this.store.setTheme(themeid);
    themes[themeid].apply();
  }

  resetCustomTheme() {
    if (!this.store) {
      return;
    }
    this.customTheme!.reset();
    this.store.saveCustomStyle();
    this.#brightnessInput.value!.value = this.customTheme!.backgroundBrightness.toString();
    this.#saturationInput.value!.value = this.customTheme!.backgroundSaturation.toString();
    this.#blurInput.value!.value = this.customTheme!.backgroundBlur.toString();
  }

  renderThemeOption(themeid: ThemeId) {
    return html`<option value=${themeid} ?selected=${this.store!.theme === themeid}>${themes[themeid].displayName}</option>`;
  }

  handleStyle(e: InputEvent) {
    if (!this.store) {
      return;
    }
    const slider = e.target as HTMLInputElement;
    switch (slider) {
      case this.#brightnessInput.value: {
        this.store.customStyle.backgroundBrightness = parseFloat(slider.value);
        break;
      }
      case this.#saturationInput.value: {
        this.store.customStyle.backgroundSaturation = parseFloat(slider.value);
        break;
      }
      case this.#blurInput.value: {
        this.store.customStyle.backgroundBlur = parseFloat(slider.value);
        break;
      }
    }
    this.store?.saveCustomStyle();
  }

  #brightnessInput: Ref<HTMLInputElement> = createRef();
  #saturationInput: Ref<HTMLInputElement> = createRef();
  #blurInput: Ref<HTMLInputElement> = createRef();

  renderSettings() {
    this.#themeKeys ??= Object.keys(themes) as ThemeId[];
    return html`<h2>Settings</h2>
      <section>
        <h3>Theme</h3>
        <select @input=${this.themeChanged}>
          ${map(this.#themeKeys, theme => this.renderThemeOption(theme))}
        </select>
        <h3>Background Customization</h3>
        <button @click=${this.resetCustomTheme}>Reset Background</button>
        <h4>Background Brightness</h4>
        <input
          ${ref(this.#brightnessInput)}
          type="range"
          min=${CustomTheme.minBrightness}
          max=${CustomTheme.maxBrightness}
          step="0.05"
          .value=${this.store?.customStyle.backgroundBrightness}
          @input=${this.handleStyle}
        />
        <h4>Background saturation</h4>
        <input
          ${ref(this.#saturationInput)}
          type="range"
          min=${CustomTheme.minSaturation}
          max=${CustomTheme.maxSaturation}
          step="0.05"
          .value=${this.store?.customStyle.backgroundSaturation}
          @input=${this.handleStyle}
        />
        <h4>Background Blur</h4>
        <input
          ${ref(this.#blurInput)}
          type="range"
          min=${CustomTheme.minBlur}
          max=${CustomTheme.maxBlur}
          step="1"
          .value=${this.store?.customStyle.backgroundBlur}
          @input=${this.handleStyle}
        />
      </section>`;
  }

  render() {
    const noStore = html`<p>Settings Store not Loaded</p>`;
    const settingsTemplate = this.renderSettings();
    return html`${this.store ? settingsTemplate : noStore}`;
  }

  static styles = [
    css`
      :host {
        min-width: 24rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        button {
          font-size: 1.15rem;
          padding: 0.5rem 1.5rem;
          box-sizing: border-box;
          height: fit-content;
          width: fit-content;
        }
      }
      h2 {
        margin: 0;
        font-size: 2rem;
      }
      section {
        display: grid;
        grid-template-columns: 2fr 27ch;
        grid-auto-rows: 2.5rem;
        column-gap: 3rem;
        row-gap: 0.5rem;
        select,
        input {
          height: 2.5em;
          place-self: center stretch;
        }

        button {
          place-self: center end;
        }

        h3,
        h4 {
          font-size: 1.3rem;
          place-self: center start;
          margin: 0;
        }

        h4 {
          font-size: 1.15rem;
          padding-inline-start: 3ch;
        }
      }
    `,
    buttonStyles,
    applicationRules,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-settings': BYFOSettings;
  }
  export interface Field {
    id: string;
    label: string;
    initial: string;
    validate?: (val: string) => boolean;
  }
}
