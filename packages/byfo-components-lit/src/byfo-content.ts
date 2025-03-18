import { LitElement, css, html } from 'lit-element';
import { customElement, property } from 'lit-element/decorators.js';

/**
 * Displays a piece of round content in proper card aspect ratio
 * @property type - Whether this is an image or text being displayed
 * @property content - The content to be displayed
 * @property sendingTo - The person next in gameplay (optional)
 */
@customElement('byfo-content')
export class ByfoContent extends LitElement {
  @property() type?: string;
  @property() content?: string;
  @property() sendingTo?: string;

  render() {
    return html` <article>
      ${this.type === 'image' ? html`<img src=${this.content} />` : html`<p>${this.content}</p>`}
      ${this.sendingTo && this.type !== 'image'
        ? html`<p class="destination"><strong>Sending to:</strong> ${this.sendingTo}</p>`
        : null}
    </article>`;
  }
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    article p {
      margin: 0;
      padding: 0.5rem 1rem;
      &:not(.destination) {
        user-select: text;
        overflow-wrap: break-word;
        word-wrap: break-word;
        font-size: x-large;
        font-weight: 500;
      }
    }

    .destination {
      border-top: 1px solid var(--color-border);
    }

    article img {
      width: calc(100% - 2rem);
      margin: 1rem;
      margin-bottom: 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
    }

    article {
      border: none;
      border-radius: 0.75rem;
      color: var(--color-backdrop-text, black);
      background-color: var(--color-backdrop, white);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-content': ByfoContent;
  }
}
