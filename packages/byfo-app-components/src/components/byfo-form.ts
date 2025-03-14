import { LitElement, PropertyValues, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from '../utils/byfoCustomElement';
import { html } from '../utils/byfoHtml';

import { applicationRules } from '@byfo/themes';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';
import { buttonStyle, inputStyle } from '../styles/index';

/**
 * Form element to handle inputs and validation
 * @property heading The form header
 * @property fields data about field types, names, and validators
 * @property onSubmit Callback when the form is submitted with valid values
 * @property buttonLabel Label for the submission button
 */
@customElement('byfo-form')
export class BYFOForm extends LitElement {
  @property() heading?: string;
  @property() fields?: Field[];
  @property() onSubmit?: (fieldValues: Record<string, string>) => void | Promise<void>;
  @property() buttonLabel?: string;
  @state() submissionDisabled: boolean = true;
  @state() error?: string;
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

  catchSubmitError = (e: Error) => {
    const { message } = e;
    this.error = message;
    setTimeout(() => {
      if (this.error === message) this.error = undefined;
    }, 3000);
  };

  submit() {
    if (Object.values(this.valid).every(v => v)) {
      try {
        this.onSubmit?.(this.values)?.catch(this.catchSubmitError);
      } catch (e) {
        this.catchSubmitError(e as Error);
      }
    }
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
            html`${when(
                !!field.label,
                () => html`<p>${field.label}</p>`,
                () => html``,
              )} <input type="text" @input=${this.handleInput} value=${field.initial} id=${`field-${field.id}`} class=${!field.label ? 'span' : ''} />`,
        )}
      </section>
      <p class="error">${this.error ?? ''}</p>
      <button class="big" @click=${this.submit} ?disabled=${this.submissionDisabled} part="submit-button">${this.buttonLabel}</button>`;
  }

  static styles = [
    css`
      :host {
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
        width: 30rem;
        max-width: 100%;
        display: grid;
        grid-template-columns: 1fr 3fr;
        grid-auto-rows: 2.5rem;
        align-items: center;
        justify-content: center;
        column-gap: var(--form-column-gap, 1rem);
        row-gap: var(--form-row-gap, 1rem);
      }
      p.error {
        --error-height: calc(-1 * (var(--form-row-gap) / 2));
        margin-block: var(--error-height);
      }
      input.span {
        grid-column: span 2;
      }
    `,
    buttonStyle,
    inputStyle,
    applicationRules,
  ];
}
export default BYFOForm;

/**
 * Form field declaration
 * @param id The object key to retrieve values from
 * @param label The form label to go with the input
 * @param initial The value that is placed in the input by default
 * @param validate A function that takes a text value and determines if it's valid. Error throwing is allowed
 */
export interface Field {
  id: string;
  label?: string;
  initial: string;
  validate?: (val: string) => boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-form': BYFOForm;
  }
}
