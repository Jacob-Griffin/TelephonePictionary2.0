import { LitElement, css } from 'lit';
import { customElement } from '../utils/byfoCustomElement';
import { html } from '../utils/byfoHtml';

import buttonStyles from '../styles/button.style';
import { applicationRules } from '@byfo/themes';
import { ByfoIcon } from './functional/Icon';
import { createRef, ref, Ref } from 'lit/directives/ref.js';

@customElement('byfo-modal')
export default class BYFOModal extends LitElement {
  #dialog: Ref<HTMLDialogElement> = createRef();
  get dialog() {
    return this.#dialog.value;
  }
  openModal = () => {
    this.dialog?.showModal();
  };
  closeModal = () => {
    this.dialog?.close();
  };

  backdropCloseModal = (e: PointerEvent) => {
    if ((e.target as HTMLElement) !== this.dialog) {
      // Other click events will bubble up, and not all of them have the correct mouse positions
      // If the click was on the backdrop, then the click target will be the dialog
      return;
    }
    const bbox = this.dialog!.getBoundingClientRect();
    if (e.clientX > bbox.right || e.clientX < bbox.left || e.clientY > bbox.bottom || e.clientY < bbox.top) {
      this.closeModal();
    }
  };

  render() {
    return html`<button class=${this.classList.contains('big-button') ? 'big' : ''} @click=${this.openModal} part="openbutton"><slot name="buttontext"></slot></button>
      <dialog ${ref(this.#dialog)} @click=${this.backdropCloseModal} part="dialog">
        <button @click=${this.closeModal} class="close-button">${ByfoIcon('x')}</button><slot name="content"></slot>
      </dialog>`;
  }

  static styles = [
    css`
      dialog {
        position: relative;
        min-height: 10rem;
        min-width: 14rem;
        width: fit-content;
        height: fit-content;
        max-height: 80vh;
        max-width: 80vw;
        border: none;
        border-radius: 1rem;
        background-color: var(--byfo-color-background);
        box-shadow: 0 0 2rem 0.5rem #0005;
        padding: 1.5rem 3rem;
        &::backdrop {
          background-color: #14111480;
        }
      }
      .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        height: 2rem;
        width: 2rem;
        padding: 0;
        background: none;
        color: var(--byfo-text-main);
        &:hover {
          background: none;
        }
      }
      :host button.big {
        max-width: 24rem;
        height: 4rem;
        border-radius: 1rem;
      }
    `,
    buttonStyles,
    applicationRules,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-modal': BYFOModal;
  }
}
