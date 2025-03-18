import { LitElement, PropertyValues, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from '../utils/byfoCustomElement';
import { buttonStyle } from '../styles';
import { BYFOGameState } from 'byfo-utils';
import { applicationRules } from '@byfo/themes';

@customElement('byfo-writing-input')
export class BYFOWritingInput extends LitElement {
  @property() gameState?: BYFOGameState;

  submit() {
    try {
      this.gameState?.submitRound(this.text);
    } catch (e) {
      console.error(e);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.text = this.gameState?.getBackup() ?? '';
    this.gameState?.on('currentTimeRemaining', t => (t && t < 0 ? this.submit() : null));
    this.gameState?.on('submitting', v => (this.submitting = v));
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    const textarea = this.shadowRoot!.getElementById('text-input')! as HTMLTextAreaElement;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = textarea.innerText.length - 1;
  }

  #text: string = '';
  get text() {
    return this.#text;
  }
  set text(v: string) {
    this.#text = v;
    this.gameState?.setBackup(v);
    if (
      this.text.trim().length > 0 &&
      this.text.length < (this.gameState?.config.textboxMaxCharacters ?? 288)
    ) {
      this.textValid ||= true;
    } else {
      this.textValid &&= false;
    }
    if (v.length !== this.textLength) {
      this.textLength = v.length;
    }
    const newLines = (v.match(/\n/g)?.length ?? 0) + 1;
    if (newLines !== this.textLines) {
      this.textLines = newLines;
    }
  }
  @state() textValid: boolean = false;
  @state() textLength: number = 0;
  @state() textLines: number = 1;
  @state() submitting: boolean = false;
  handleInput = (e: InputEvent) => {
    this.text = (e.target as HTMLInputElement).value;
  };

  get placeholderText() {
    if (this.gameState?.round! > 0) {
      return 'Describe the image you were sent';
    } else {
      return 'Type in a word, phrase, or sentence to be passed along';
    }
  }

  renderTextBox() {
    return html`<div id="text-input-wrapper">
      <textarea
        id="text-input"
        rows=${this.textLines}
        value=${this.text}
        placeholder=${this.placeholderText}
        @input=${this.handleInput}
      >
${this.text}</textarea
      >
      <div
        id="character-limit-count"
        class=${this.text.length > (this.gameState?.config.textboxMaxCharacters ?? 288) ? 'danger' : ''}
      >
        ${this.textLength}/${this.gameState?.config.textboxMaxCharacters ?? 288}
      </div>
    </div>`;
  }

  render() {
    return html`${this.renderTextBox()}
      <button class="big" @click=${this.submit} ?disabled=${!this.textValid || this.submitting}>
        ${this.submitting ? 'Submitting...' : 'Submit'}
      </button>`;
  }
  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
        width: 100%;
        max-width: 1000px;
      }
      #text-input-wrapper {
        width: 100%;
        height: fit-content;
        display: flex;
        position: relative;
        textarea {
          width: 100%;
          max-height: 8.75rem;
          resize: none;
          white-space: nowrap;
          font-size: 1.6rem;
          padding: 0.5rem;
          padding-bottom: 1rem;
          background-color: white;
          border-radius: 0.5rem;
          border: 1px solid var(--byfo-color-border);
          overflow-x: auto;
        }
        #character-limit-count {
          position: absolute;
          right: 0.5rem;
          bottom: 0.125rem;
          border-radius: 0 0 0 0.25rem;
          padding: 0;
          padding-left: 0.25rem;
          margin: 0;
        }
      }
      .danger {
        color: red;
      }
    `,
    applicationRules,
    buttonStyle,
  ];
}

export default BYFOWritingInput;

declare global {
  interface HTMLElementTagNameMap {
    'byfo-writing-input': BYFOWritingInput;
  }
}
