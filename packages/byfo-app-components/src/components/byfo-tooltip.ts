import { LitElement, css } from 'lit';
import { customElement } from '../utils/byfoCustomElement';
import { html } from '../utils/byfoHtml';

import { applicationRules } from '@byfo/themes';
import { property } from 'lit/decorators.js';

@customElement('byfo-tooltip')
export default class BYFOTooltip extends LitElement {
  @property() message: string = '';
  @property({ reflect: true }) valign: 'top' | 'bottom' | 'middle' = 'middle';

  render() {
    return html`<slot></slot>
      <article><p>${this.message}</p></article>`;
  }

  static styles = [
    css`
      :host {
        position: relative;
        display: inline;
      }
      article {
        position: absolute;
        top: 0;
        left: 100%;
        margin-left: 0.25rem;
        opacity: 0;
        transition: opacity ease-in-out 150ms;

        background-color: var(--byfo-color-backdrop);
        border-radius: 0.5rem;
        box-shadow: 0 0 2px 1px;
        padding: 0.25rem 0.5rem;
        font-size: 1rem;

        width: max-content;
        max-width: 30ch;
      }
      :host([valign='bottom']) > article {
        top: unset;
        bottom: 0;
      }
      :host([valign='middle']) > article {
        top: 50%;
        transform: translateY(-50%);
      }
      slot:hover + article {
        opacity: 1;
      }
      ::slotted(byfo-icon) {
        display: inline-block;
        height: 1em;
        width: 1em;
      }
      p {
        margin: 0;
      }
    `,
    applicationRules,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-tooltip': BYFOTooltip;
  }
}
