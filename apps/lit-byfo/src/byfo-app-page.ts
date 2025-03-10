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

  #redirect(route: string, arg?: string) {
    const routeObj = routes[route];
    if (!routeObj) {
      return;
    }
    this.route = route;
    this.routeArg = arg;
    if (this.loaded) {
      window.history.pushState({}, '', routeObj.renderUrl(arg));
    }
    if (routeObj.title) {
      document.title = routeObj.title + ' | Blow Your Face Off';
    }
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
      this.#redirect(route.route, route.routeArg);
      this.loaded = true;
    } else {
      this.route = 'home';
      window.history.replaceState({}, '', '/');
    }
  }

  store = new BYFOStore();
  loaded: boolean = false;

  @state() route?: string;
  @state() routeArg?: string;

  render() {
    return html`<section class=${this.route === 'home' ? 'header invisible' : 'header'}>
        <div id="small-logo"></div>
        <byfo-modal id="settings"><span slot="buttontext">${ByfoIcon('gear')}</span><byfo-settings slot="content" .store=${this.store}></byfo-settings></byfo-modal>
      </section>
      <main>${choose(this.route, routeMap, () => html``)}</main>`;
  }

  static styles = css`
    :host {
      --header-size: 4.5rem;
      width: 100%;
      height: 100vh;
      overflow-y: auto;
      margin: 0;
      padding: 0;
      display: block;
    }
    .header {
      height: var(--header-size);
      background-color: var(--byfo-color-brand);
    }

    .invisible {
      background-color: transparent;
      #settings::part(openbutton) {
        border-radius: 0 0 0 1rem;
      }
      #small-logo {
        display: none;
      }
    }

    #small-logo {
      position: fixed;
      width: 100vw;
      top: 0;
      inset-inline: 0;
      height: var(--header-size);
      background-image: var(--byfo-image-small-icon);
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
    }

    #settings::part(openbutton) {
      position: fixed;
      top: 0;
      right: 0;
      width: var(--header-size);
      height: var(--header-size);
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
