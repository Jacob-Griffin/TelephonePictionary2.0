import { css, html } from 'lit-element';
import { customElement, property } from 'lit-element/decorators.js';
import { TargetedEvent, TargetedInputEvent, toggleStyles } from './common';
import { ByfoModal } from './byfo-modal';
import './byfo-info-bubble';
import type { TPStore } from '../../byfo-utils/dist';
import { themes } from 'byfo-themes';

/**
 * A modal that contains various client-side settings
 * @property store - A localstorage management object
 * @property buildDate - An object describing how to format dates
 */
@customElement('byfo-settings-modal')
export class ByfoSettingsModal extends ByfoModal {
  @property() store?: TPStore;
  @property() buildDate?: { year: string; full?: string; date?: Date };

  //Explicitly type render root as shadow root
  renderRoot = this.renderRoot as DocumentFragment;

  passClick(e: TargetedEvent) {
    const target = e.target?.id?.match(/^(.+)-toggle$/)?.[1];
    if (target) {
      this.renderRoot.getElementById(`${target}Input`)?.click();
    }
  }

  handleToggle = (prop: string, setter: (v: boolean) => void, e: TargetedInputEvent) => {
    const enabled = e.target.checked;
    setter(enabled);
    const div = this.renderRoot.getElementById(`${prop}-toggle`)!;
    if (enabled && !div.classList.contains('checked')) {
      div.classList.add('checked');
      return;
    }
    if (!enabled) {
      div.classList.remove('checked');
    }
  };

  resetBackground() {
    this.store?.resetCustomStyles();
    Object.entries(this.store?.customStyle ?? {}).forEach(([prop, value]) => {
      const dashProp = prop.replace(/[A-Z]/, c => `-${c.toLowerCase()}`);
      const input = this.renderRoot.getElementById(dashProp) as HTMLInputElement;
      if (!input) return;
      input.value = /px$/.test(value) ? `${parseInt(value)}` : value;
    });
  }

  styleInput(prop: string, unit?: string) {
    return (e: TargetedInputEvent) => this.store?.setCustomStyle(prop, `${e.target.value}${unit ?? ''}`);
  }

  override renderBody() {
    return html`
      <h2>Settings</h2>
      <section class="settings">
        <div>
          <h2 class="label">Theme</h2>
          <select @input=${(e: InputEvent) => this.store?.setTheme((e.target as HTMLSelectElement).value)}>
            ${Object.values(themes).map(theme => {
              return theme.key === this.store?.theme
                ? html` <option value=${theme.key} selected>${theme.displayName}</option> `
                : html` <option value=${theme.key}>${theme.displayName}</option> `;
            })}
          </select>
        </div>
        <div>
          <h2 class="label">Background Customization:</h2>
          <button class="small" @click=${this.resetBackground}>Reset Background</button>
        </div>
        <div class="indent-1">
          <h2 class="label">Background Brightness:</h2>
          <input
            type="range"
            min="0.4"
            max="1.3"
            step="0.05"
            id="background-brightness"
            value=${this.store?.customStyle.backgroundBrightness}
            @input=${this.styleInput('backgroundBrightness')}
          />
        </div>
        <div class="indent-1">
          <h2 class="label">Background Saturation:</h2>
          <input
            type="range"
            min="0.7"
            max="1.4"
            step="0.05"
            id="background-saturation"
            value=${this.store?.customStyle.backgroundSaturation}
            @input=${this.styleInput('backgroundSaturation')}
          />
        </div>
        <div class="indent-1">
          <h2 class="label">Background Blur:</h2>
          <input
            type="range"
            min="0"
            max="10"
            id="background-blur"
            value=${this.store?.customStyle.backgroundBlur.replace('px', '')}
            @input=${this.styleInput('backgroundBlur', 'px')}
          />
        </div>
        <div>
          <h2 class="label">
            Always "Show all" <byfo-info-bubble content="Applies to review page"></byfo-info-bubble>
          </h2>
          <div
            id="showAll-toggle"
            class=${`toggle-wrapper${this.store?.alwaysShowAll ? ' checked' : ''}`}
            @click=${this.passClick}
          >
            <input
              type="checkbox"
              id="showAllInput"
              @input=${(e: TargetedInputEvent) =>
                this.handleToggle('showAll', this.store?.setShowAll ?? (() => {}), e)}
              checked=${this.store?.alwaysShowAll ? true : null}
            />
            <label htmlFor="showAllInput"></label>
          </div>
        </div>
      </section>
      <h4>
        Looking for help? Check our
        <a href="https://github.com/Jacob-Griffin/TelephonePictionary2.0/wiki/Knowlege-Base">knowlege base</a>
      </h4>
      ${this.buildDate?.full ? html` <p>Built on ${this.buildDate.full}</p> ` : null}
    `;
  }

  static styles = css`
    ${ByfoModal.styles}
    ${toggleStyles}
    [icon='info'] {
      display: inline-block;
      position: relative;
      cursor: pointer;
      top: 0.15em;
      height: 1em;
      width: 1em;
    }

    .settings {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .settings > div {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 500px;
      padding-block: 0.75rem;
      align-items: center;

      &.indent-1 {
        width: 95%;
        max-width: 475px;
        margin-inline-start: max(2.5%, 25px);
        font-size: 0.9em;
        padding-block: 0.4rem;
      }
    }

    .settings select {
      width: 20ch;
      height: 2rem;
      border-radius: 0.5rem;
      font-size: medium;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-settings-modal': ByfoSettingsModal;
  }
}
