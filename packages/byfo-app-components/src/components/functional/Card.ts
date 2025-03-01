import { html, css, TemplateResult } from 'lit';
import { ByfoMarkdown } from './Markdown';

export function ByfoCard(content: string, type: 'text' | 'image', author: string): TemplateResult {
  return html`<article>
    ${type === 'text' ? ByfoMarkdown(content) : html`<img src=${content} />`}
    <div class="name-tag">${author}</div>
  </article>`;
}

export const cardStyles = css``;
