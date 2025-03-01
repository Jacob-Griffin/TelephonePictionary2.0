import { LitElement, PropertyValues, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from '../utils/byfoCustomElement.ts';
import { html } from '../utils/byfoHtml';

import buttonStyles from '../styles/button.style.ts';
import { applicationRules } from '@byfo/themes';
import { map } from 'lit/directives/map.js';

@customElement('byfo-form')
export default class BYFOModal extends LitElement {
  @property() heading?: string;
  @property() fields?: Field[];
  @property() onSubmit?: (fieldValues: Record<string, string>) => void;
  @property() buttonLabel?: string;
  @state() submissionDisabled: boolean = true;
  error?: string;
  errors: Record<string, string | undefined> = {};
  values: Record<string, string> = {};
  valid: Record<string, boolean> = {};

  handleInput = (e: InputEvent) => {
    const el = e.target as HTMLInputElement;
    const fieldId = el.id.replace(/^field-/, '');
    this.handleValue(fieldId, el.value);
  };

  handleValue = (id: string, value: string, vFn?: (val: string) => boolean) => {
    this.values[id] = value;
    const validate = vFn ?? this.fields?.find(f => f.id === id)?.validate ?? ((_v: string) => true);
    try {
      this.valid[id] = validate(value);
      this.errors[id] = undefined;
    } catch (e) {
      this.valid[id] = false;
      if (e instanceof Error) {
        this.errors[id] = e.message;
      }
    }
    this.error = Object.values(this.errors).find(e => (e?.length ?? 0) > 0);
    this.submissionDisabled = Object.values(this.valid).some(v => !v);
  };

  submit() {
    this.onSubmit?.(this.values);
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('fields')) {
      this.values = {};
      this.valid = {};
      this.fields?.forEach(field => {
        this.handleValue(field.id, field.initial, field.validate);
      });
    }
  }

  render() {
    return html`<h2>${this.heading}</h2>
      <section>
        ${map(
          this.fields,
          field =>
            html`<p>${field.label}</p>
              <input type="text" @input=${this.handleInput} value=${field.initial} id=${`field-${field.id}`} />`,
        )}
      </section>
      <button @click=${this.submit} ?disabled=${this.submissionDisabled}>${this.buttonLabel}</button>`;
  }

  static styles = [
    css`
      :host {
        min-width: 20rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        button {
          font-size: 1.3rem;
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
        grid-template-columns: 1fr 3fr;
        grid-auto-rows: 2rem;
        align-content: center;
        justify-content: center;
        column-gap: 1rem;
        row-gap: 1rem;
        input,
        p {
          height: 1.2em;
          margin: 0;
          font-size: 1.3rem;
        }
      }
    `,
    buttonStyles,
    applicationRules,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-form': BYFOModal;
  }
  export interface Field {
    id: string;
    label: string;
    initial: string;
    validate?: (val: string) => boolean;
  }
}
