import { html } from 'lit';
import { mapRoutes, type RouteList } from '@byfo/utils';

export const routes: RouteList = {
  home: {
    match: p => {
      return p === '/' ? { route: 'home' } : undefined;
    },
    render: () => {
      if (!window.customElements.get('byfo-app-home')) {
        import('./pages/byfo-app-home.ts');
      }
      return html`<byfo-app-home></byfo-app-home>`;
    },
    renderUrl: () => '/',
    title: 'Home',
    default: true,
  },
  game: {
    match: p => {
      const r = p.match(/^\/game\/(\d{1,7})\/?$/);
      return r ? { route: 'game', arg: r[1] } : undefined;
    },
    render: () => {
      if (!window.customElements.get('byfo-app-gameplay')) {
        import('./pages/byfo-app-gameplay.ts');
      }
      return html`<byfo-app-gameplay></byfo-app-gameplay>`;
    },
    renderUrl: gameid => `/game/${gameid}`,
    title: 'Game',
  },
  lobby: {
    match: p => {
      const r = p.match(/^\/lobby\/(\d{1,7})\/?$/);
      return r ? { route: 'lobby', arg: r[1] } : undefined;
    },
    render: () => {
      if (!window.customElements.get('byfo-app-lobby')) {
        import('./pages/byfo-app-lobby.ts');
      }
      return html`<byfo-app-lobby></byfo-app-lobby>`;
    },
    renderUrl: gameid => `/lobby/${gameid}`,
    title: 'Lobby',
  },
  join: {
    match: p => {
      const r = p.match(/^\/join\/(\d{1,7})\/?$/);
      return r ? { route: 'join', arg: r[1] } : undefined;
    },
    render: () => {
      if (!window.customElements.get('byfo-app-join')) {
        import('./pages/byfo-app-join.ts');
      }
      return html`<byfo-app-join></byfo-app-join>`;
    },
    renderUrl: gameid => `/join/${gameid}`,
    title: 'Join',
  },
  review: {
    match: p => {
      const r = p.match(/^\/review\/(\d{1,7})\/?$/);
      return r ? { route: 'review', arg: r[1], query: { stack: r[2] } } : undefined;
    },
    render: () => {
      if (!window.customElements.get('byfo-app-review')) {
        import('./pages/byfo-app-review.ts');
      }
      return html`<byfo-app-review></byfo-app-review>`;
    },
    renderUrl: gameid => `/review/${gameid}`,
    title: 'review',
  },
};
export const routeMap = mapRoutes(routes);
