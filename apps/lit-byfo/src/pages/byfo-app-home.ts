import { installRootStyles } from '@byfo/themes';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('byfo-app-home')
export class ByfoAppHome extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
  }
  render() {
    return html`<div id="icon-row">
        <div id="icon-spacer"></div>
        <div id="main-icon"></div>
      </div>
      <section></section>`;
  }

  static styles = css`
    :host {
      display: block;
    }
    #test {
      height: 5rem;
      background-color: red;
      width: var(--icon-offset);
    }
    #icon-row {
      height: 40vh;
      align-items: stretch;
      display: flex;
    }
    #main-icon {
      flex-grow: 1;
      background-image: var(--byfo-image-icon);
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
    }
    #icon-spacer {
      width: calc(10% - 64px);
      max-width: 64px;
    }
    section {
      padding: 1rem;
      place-self: stretch;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h1 {
      margin: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-home': ByfoAppHome;
  }
}
