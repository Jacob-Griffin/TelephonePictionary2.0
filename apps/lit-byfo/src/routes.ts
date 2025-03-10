import { html, TemplateResult } from 'lit';

export type RouteResult = { route?: string; routeArg?: string };

export const routes: Record<string, { match: (p: string) => RouteResult; render: () => TemplateResult }> = {
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
  },
};
export const routeMap = Object.entries(routes).map(([key, val]) => [key, val.render]) as [keyof typeof routes, () => TemplateResult][];
