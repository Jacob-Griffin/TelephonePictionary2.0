import { LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';
import { customElement } from '../utils/byfoCustomElement';
import { map } from 'lit/directives/map.js';
import { html } from '../utils/byfoHtml';

import buttonStyles from '../styles/button.style';
import { applicationRules, CustomBackgroundType, CustomTheme } from '@byfo/themes';
import { BYFOStore } from '@byfo/utils';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { ByfoIcon } from './functional/Icon';
import { ByfoToggle, toggleStyles } from './functional/Toggle';
import { choose } from 'lit/directives/choose.js';

@customElement('byfo-settings')
export default class BYFOSettings<T extends readonly string[]> extends LitElement {
  @property() store!: BYFOStore<T>;
  get customTheme() {
    return this.store.customStyle;
  }

  #themeKeys?: T[number][];

  themeChanged(e: InputEvent) {
    const themeid = (e.target as HTMLSelectElement).value as T[number];
    this.store.setTheme(themeid);
    this.store.themes[themeid].apply();
  }

  resetCustomTheme() {
    this.customTheme!.reset();
    this.store.saveCustomStyle();
    this.#brightnessInput.value!.value = this.customTheme!.backgroundBrightness.toString();
    this.#saturationInput.value!.value = this.customTheme!.backgroundSaturation.toString();
    this.#blurInput.value!.value = this.customTheme!.backgroundBlur.toString();
  }

  renderThemeOption(themeid: T[number]) {
    return html`<option value=${themeid} ?selected=${this.store.theme === themeid}>
      ${this.store.themes[themeid].displayName}
    </option>`;
  }

  handleStyle(e: InputEvent) {
    if (!this.store) {
      return;
    }
    const slider = e.target as HTMLInputElement;
    switch (slider) {
      case this.#brightnessInput.value: {
        this.customTheme.backgroundBrightness = parseFloat(slider.value);
        break;
      }
      case this.#saturationInput.value: {
        this.customTheme.backgroundSaturation = parseFloat(slider.value);
        break;
      }
      case this.#blurInput.value: {
        this.customTheme.backgroundBlur = parseFloat(slider.value);
        break;
      }
    }
    this.store?.saveCustomStyle();
  }

  handleBackgroundChange(e: InputEvent) {
    const inputEl = e.target as HTMLInputElement;
    if (this.customTheme.backgroundType === 'color' && inputEl.type === 'text') {
      this.customTheme.customBackground = inputEl.value;
      this.store?.saveCustomStyle();
      return;
    }
    if (this.customTheme.backgroundType === 'image' && inputEl.type === 'file') {
      this.store.readImageData(e).then(() => {
        this.store?.saveCustomStyle();
      });
    }
  }

  handleBackgroundTypeChange(e: InputEvent) {
    const type = (e.target as HTMLSelectElement).value as CustomBackgroundType;
    this.customTheme.customBackground = '';
    this.customTheme.backgroundType = type;
    this.requestUpdate();
  }

  #brightnessInput: Ref<HTMLInputElement> = createRef();
  #saturationInput: Ref<HTMLInputElement> = createRef();
  #blurInput: Ref<HTMLInputElement> = createRef();

  renderSettings() {
    this.#themeKeys ??= Object.keys(this.store.themes);
    return html`<h2>Settings</h2>
      <section>
        <h3>Theme</h3>
        <select @input=${this.themeChanged}>
          ${map(this.#themeKeys, theme => this.renderThemeOption(theme))}
        </select>
        <h3>Custom Background</h3>
        <select @input=${this.handleBackgroundTypeChange} .value=${this.customTheme.backgroundType}>
          <option value="none">None</option>
          <option value="image">Image</option>
          <option value="color">Color</option>
        </select>
        ${choose(this.customTheme.backgroundType, [
          ['none', () => html``],
          [
            'image',
            () =>
              html`<h4>Background Image</h4>
                <input type="file" @change=${this.handleBackgroundChange} />`,
          ],
          [
            'color',
            () =>
              html`<h4>Background Color</h4>
                <input
                  type="text"
                  @input=${this.handleBackgroundChange}
                  .value=${this.customTheme.customBackground}
                />`,
          ],
        ])}
        <h3>Background Tweaks</h3>
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
        <h3>
          Always "Show all"
          <byfo-tooltip
            message="This makes it so that all cards in a stack are visible right away at the end of a game"
            >${ByfoIcon('info')}</byfo-tooltip
          >
        </h3>
        ${ByfoToggle(this.store?.setShowAll ?? (() => {}), !!this.store?.alwaysShowAll)}
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
          place-self: center;
        }

        h3,
        h4 {
          font-size: 1.3rem;
          place-self: center start;
          margin: 0;
          vertical-align: middle;
        }

        h4 {
          font-size: 1.15rem;
          padding-inline-start: 3ch;
        }
        byfo-toggle {
          --unit: 1.15rem;
          place-self: center end;
        }
      }
    `,
    buttonStyles,
    toggleStyles,
    applicationRules,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-settings': BYFOSettings<readonly string[]>;
  }
}
