import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { routes, routeMap } from './routes';
import { choose } from 'lit/directives/choose.js';
import { installRootStyles, themes } from '@byfo/themes';
import { ByfoIcon } from '@byfo/components/functional';
import '@byfo/components/all';
import { BYFOFirebaseAdapter, RouteResult, BYFOStore } from '@byfo/utils';
import { provide } from '@lit/context';
import { firebaseContext, storeContext, routeContext } from './context';

@customElement('byfo-app-page')
export class ByfoAppPage extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    this.#fetchRoute(true);
    window.addEventListener('popstate', () => this.#fetchRoute(true));
  }

  #renderQuery(query?: Record<string, string>) {
    if (!query) {
      return '';
    }
    let res = '?';
    for (const key in query) {
      res += encodeURIComponent(`${key}=${query[key]}`);
    }
    return res;
  }

  #redirect(route: string, arg?: string, query?: Record<string, string>, fromWindow?: boolean) {
    const routeObj = routes[route];
    if (!routeObj) {
      return;
    }
    this.route = { route, arg, query };
    if (!fromWindow) {
      window.history.pushState({}, '', routeObj.renderUrl(arg) + this.#renderQuery(query));
    }
    if (routeObj.title) {
      document.title = routeObj.title + ' | Blow Your Face Off';
    }
  }

  #fetchRoute(fromWindow?: boolean) {
    const p = window.location.pathname;
    let route: RouteResult | undefined;
    for (const routeKey in routes) {
      route = routes[routeKey].match(p);
      if (route && 'route' in route) {
        break;
      }
    }
    if (route && 'route' in route) {
      const query = this.#parseQueryString(window.location.search);
      this.#redirect(route.route, route.arg, query, fromWindow);
    } else {
      const [defaultRoute] = Object.entries(routes).find(([_, value]) => value.default) ?? ['home'];
      this.route = { route: defaultRoute, arg: undefined };
      window.history.replaceState({}, '', '/');
    }
  }

  #parseQueryString(search: string): Record<string, string> {
    const entries = search.replace(/^\?/, '').split('&');
    const result: Record<string, string> = {};
    for (const entry of entries) {
      const [key, value] = entry.split('=');
      result[key] = decodeURIComponent(value);
    }
    return result;
  }

  handleRedirect = ({ detail }: CustomEvent<RouteResult>) => {
    this.#redirect(detail.route, detail.arg, detail.query);
  };

  @provide({ context: storeContext }) store = new BYFOStore<ThemeId[]>(themes, 'classic');
  @provide({ context: firebaseContext }) firebase = new BYFOFirebaseAdapter(__FIREBASE_CONFIG__, {});

  @provide({ context: routeContext })
  @state()
  route: RouteResult = { route: '' };

  render() {
    return html`<section class=${this.route.route === 'home' ? 'header invisible' : 'header'}>
        <div id="small-logo"></div>
        <byfo-modal id="settings"
          ><span slot="buttontext">${ByfoIcon('gear')}</span
          ><byfo-settings slot="content" .store=${this.store}></byfo-settings
        ></byfo-modal>
      </section>
      <main @byforedirect=${this.handleRedirect}>${choose(this.route.route, routeMap, () => html``)}</main>`;
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
  type ThemeId = keyof typeof themes;
}

declare const __FIREBASE_CONFIG__: ConstructorParameters<typeof BYFOFirebaseAdapter>[0];
declare const __BUILD_DATE__: { year: number; full: string; date: Date };
