import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { RouteResult, routes, routeMap } from './routes';
import { choose } from 'lit/directives/choose.js';
import { installRootStyles } from '@byfo/themes';
import { BYFOStore } from 'byfo-utils/storage';
import { ByfoIcon } from '@byfo/components/functional';
import '@byfo/components/all';

@customElement('byfo-app-page')
export class ByfoAppPage extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    this.#fetchRoute();
    installRootStyles(this.shadowRoot!);
  }

  #fetchRoute() {
    const p = window.location.pathname;
    let route: RouteResult = {};
    for (const routeKey in routes) {
      route = routes[routeKey].match(p);
      if (route.route) {
        break;
      }
    }
    if (route.route) {
      this.route = route.route;
      this.routeArg = route.routeArg;
    }
  }

  store = new BYFOStore();

  @state() route?: string;
  @state() routeArg?: string;

  render() {
    return html`<section class=${this.route !== 'home' ? 'header invisible' : 'header'}>
        <byfo-modal id="settings"><span slot="buttontext">${ByfoIcon('gear')}</span><byfo-settings slot="content" .store=${this.store}></byfo-settings></byfo-modal>
      </section>
      <main>${choose(this.route, routeMap, () => html``)}</main>`;
  }

  static styles = css`
    :host {
      width: 100%;
      height: 100vh;
      overflow-y: auto;
      margin: 0;
      padding: 0;
      display: block;
    }
    .header {
      height: 4rem;
      background-color: var(--byfo-color-brand);
    }

    .invisible {
      #settings::part(openbutton) {
        border-radius: 0 0 0 1rem;
      }
    }

    #settings::part(openbutton) {
      position: fixed;
      top: 0;
      right: 0;
      width: 4rem;
      height: 4rem;
      box-sizing: border-box;
      padding: 0.75rem;
      border-radius: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-page': ByfoAppPage;
  }
}
