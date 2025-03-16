import { html, css, TemplateResult } from 'lit';
import { ByfoMarkdown } from './Markdown';

export function ByfoCard(content: string, type: 'text' | 'image', author: string, alignment?: 'left' | 'right'): TemplateResult {
  return html`<article class=${`card ${type} ${alignment ?? ''}`}>
    ${type === 'text' ? html`<h3>${ByfoMarkdown(content)}</h3>` : html`<img src=${content} />`}
    <div class="name-tag">${author}</div>
  </article>`;
}

export const cardStyles = css`
  article.card {
    position: relative;
    background-color: var(--byfo-color-backdrop);
    color: var(--byfo-text-backdrop);
    border-radius: 1rem;
    padding: 0.75rem 1rem 0.25rem;
    margin-bottom: 1rem;
    & > h3 {
      margin-top: 0;
    }
    & > img {
      width: 100%;
      max-width: 1000px;
      aspect-ratio: 5 / 3;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }
    .name-tag {
      position: absolute;
      left: 0.5rem;
      bottom: -1rem;
      padding: 0.25rem 0.5rem;
      border-radius: 1rem;
      background-color: var(--byfo-color-brand);
      color: var(--byfo-text-brand);
    }
    &.right .name-tag {
      left: unset;
      right: 0.5rem;
    }
  }
`;
