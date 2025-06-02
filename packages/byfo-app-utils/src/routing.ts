import type { TemplateResult } from 'lit';

export type RouteResult = {
  route: string;
  arg?: string;
  query?: Record<string, string>;
};

export interface RouteDefinition {
  match: (p: string) => RouteResult | undefined;
  render: (arg?: string) => TemplateResult;
  renderUrl: (arg?: string) => string;
  title?: string;
  default?: boolean;
}

export type RouteList = Record<string, RouteDefinition>;

export function mapRoutes<T extends RouteList>(map: T): [keyof T, RouteDefinition['render']][] {
  return Object.entries(map).map(([key, def]) => [key, def.render]);
}

export function emitRedirect(src: HTMLElement, detail: RouteResult) {
  src.dispatchEvent(new CustomEvent('byforedirect', { detail, bubbles: true }));
}

declare global {
  interface HTMLElementEventMap {
    byforedirect: CustomEvent<RouteResult>;
  }
}
