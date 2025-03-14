import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { routes, routeMap } from './routes';
import { choose } from 'lit/directives/choose.js';
import { installRootStyles } from '@byfo/themes';
import { BYFOStore } from 'byfo-utils/storage';
import { ByfoIcon } from '@byfo/components/functional';
import '@byfo/components/all';
import { BYFOFirebaseAdapter, RedirectEventMap, RouteResult } from 'byfo-utils';

@customElement('byfo-app-page')
export class ByfoAppPage extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    this.#fetchRoute(true);
    window.addEventListener('popstate', () => this.#fetchRoute(true));
  }

  #redirect(route: string, arg?: string, fromWindow?: boolean) {
    const routeObj = routes[route];
    if (!routeObj) {
      return;
    }
    this.route = route;
    this.routeArg = arg;
    if (!fromWindow) {
      window.history.pushState({}, '', routeObj.renderUrl(arg));
    }
    if (routeObj.title) {
      document.title = routeObj.title + ' | Blow Your Face Off';
    }
  }

  #fetchRoute(fromWindow?: boolean) {
    const p = window.location.pathname;
    let route: RouteResult | {} = {};
    for (const routeKey in routes) {
      route = routes[routeKey].match(p);
      if ('route' in route) {
        break;
      }
    }
    if ('route' in route) {
      this.#redirect(route.route, route.arg, fromWindow);
    } else {
      const [defaultRoute] = Object.entries(routes).find(([_, value]) => value.default) ?? ['home'];
      this.route = defaultRoute;
      window.history.replaceState({}, '', '/');
    }
  }

  handleRedirect = ({ detail }: CustomEvent<RouteResult>) => {
    this.#redirect(detail.route, detail.arg);
  };

  store = new BYFOStore();
  firebase = new BYFOFirebaseAdapter(__FIREBASE_CONFIG__, {}, true);
  provides = {
    store: this.store,
    firebase: this.firebase,
    getRoute: () => ({ route: this.route, arg: this.routeArg }),
  };
  loaded: boolean = false;

  @state() route?: string;
  @state() routeArg?: string;

  render() {
    return html`<section class=${this.route === 'home' ? 'header invisible' : 'header'}>
        <div id="small-logo"></div>
        <byfo-modal id="settings"><span slot="buttontext">${ByfoIcon('gear')}</span><byfo-settings slot="content" .store=${this.store}></byfo-settings></byfo-modal>
      </section>
      <main @byforedirect=${this.handleRedirect}>${choose(this.route, routeMap, () => html``)}</main>`;
  }

  static styles = css`
    :host {
      --header-size: 4.5rem;
      width: 100%;
      height: 100vh;
      overflow-y: auto;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    .header {
      height: var(--header-size);
      background-color: var(--byfo-color-brand);
      z-index: 100;
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

    main {
      height: 100vh;
      width: 100vw;
      position: fixed;
      top: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
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
  interface HTMLElementEventMap extends RedirectEventMap {}
}

declare const __FIREBASE_CONFIG__: ConstructorParameters<typeof BYFOFirebaseAdapter>[0];
declare const __BUILD_DATE__: { year: number; full: string; date: Date };
