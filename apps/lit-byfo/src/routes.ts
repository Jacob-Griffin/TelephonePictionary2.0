import { html, TemplateResult } from 'lit';

export type RouteResult = { route?: string; routeArg?: string };

export const routes: Record<string, { match: (p: string) => RouteResult; render: (arg?: string) => TemplateResult; renderUrl: (arg?: string) => string; title?: string }> = {
  home: {
    match: p => {
      return p === '/' ? { route: 'home' } : {};
    },
    render: () => {
      if (!window.customElements.get('byfo-app-home')) {
        import('./pages/byfo-app-home.ts');
      }
      return html`<byfo-app-home></byfo-app-home>`;
    },
    renderUrl: () => '/',
    title: 'Home',
  },
  game: {
    match: p => {
      const r = p.match(/\/game\/(\d{1,7})/);
      return !!r ? { route: 'game', routeArg: r[1] } : {};
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
      const r = p.match(/\/lobby\/(\d{1,7})/);
      return !!r ? { route: 'lobby', routeArg: r[1] } : {};
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
};
export const routeMap = Object.entries(routes).map(([key, val]) => [key, val.render]) as [keyof typeof routes, () => TemplateResult][];
