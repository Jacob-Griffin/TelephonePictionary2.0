import { html, TemplateResult } from 'lit';
import { parseByToken, Token, TokenType } from 'byfo-utils';
import { map } from 'lit/directives/map.js';

export function ByfoMarkdown(contentIn: string, withAdvanced?: boolean) {
  const tokens = parseByToken(contentIn);
  return renderTokens(tokens, withAdvanced);
}

function renderTokens(tree: Token<TokenType | 'root'>, withAdvanced?: boolean): TemplateResult {
  const strings = tree.children.map(v =>
    typeof v === 'string' ? html`${v}` : renderTokens(v, withAdvanced),
  );
  const inner = html`${map(strings, v => (tree.type === 'root' ? html`${v}<br />` : v))}`;
  if (tree.type === 'header') {
    if (!withAdvanced) {
      return html`${'#'.repeat(tree.meta as number)} ${inner}`;
    }
    switch (tree.meta) {
      case 1:
        return html`<h1>${inner}</h1>`;
      case 2:
        return html`<h2>${inner}</h2>`;
      case 3:
        return html`<h3>${inner}</h3>`;
      case 4:
        return html`<h4>${inner}</h4>`;
      case 5:
        return html`<h5>${inner}</h5>`;
      case 6:
        return html`<h6>${inner}</h6>`;
      default:
        return html`<p>${inner}</p>`;
    }
  }
  if (tree.type === 'link') {
    if (!withAdvanced) {
      return html`[${inner}](${tree.meta})`;
    }
    return html`<a href=${tree.meta}>${inner}</a>`;
  }
  if (tree.type === 'list') {
    if (!withAdvanced) {
      return html`${inner}`;
    }
    return html`<ul>
      ${inner}
    </ul>`;
  }
  if (tree.type === 'listitem') {
    const tok = tree as Token<'listitem'>;
    if (!withAdvanced) {
      const tab = html`&nbsp;&nbsp;`;
      const mapper = new Array(tok.parent.meta).fill(tab);
      return html`${map(mapper, v => v)}- ${inner}<br />`;
    }
    return html`<li>${inner}</li>`;
  }
  if (tree.type === 'bold') {
    return html`<strong>${inner}</strong>`;
  }
  if (tree.type === 'italic') {
    return html`<em>${inner}</em>`;
  }
  return html`${inner}`;
}
