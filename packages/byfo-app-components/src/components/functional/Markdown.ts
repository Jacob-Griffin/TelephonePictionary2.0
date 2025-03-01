import { html, TemplateResult } from 'lit';

const splitter = '[{<<!>>}]';
export function ByfoMarkdown(contentIn: string, withAdvanced?: boolean): TemplateResult {
  const values: TemplateResult[] = [];
  const cutReplacements = withAdvanced ? parseAdvanced(contentIn, values) : parseBasic(contentIn, values);
  const template = Object.assign(
    cutReplacements.map(seg => seg.replaceAll('<', '&lt;').replaceAll('>', '&gt;')),
    { raw: cutReplacements },
  );
  return html(template, ...values);
}

function parseBasic(content: string, values: TemplateResult[]): string[] {
  return content
    .replaceAll(/(\*{1,3})(.+?)\1|\n/g, (m, stars: '*' | '**' | '***', t: string) => {
      if (m === '\n') {
        values.push(html`<br />`);
        return splitter;
      }
      switch (stars.length) {
        case 1:
          values.push(html`<em>${t}</em>`);
          break;
        case 2:
          values.push(html`<strong>${t}</strong>`);
          break;
        case 3:
          values.push(html`<strong><em>${t}</em></strong>`);
          break;
      }
      return splitter;
    })
    .split(splitter);
}

function parseAdvanced(content: string, values: TemplateResult[]): string[] {
  return content
    .replaceAll(/(?<stars>\*{1,3})(?<starcontent>.+?)\1|\n(?<h>#+) (?<hcontent>.+)\n|\[(?<linktext>[^\]]+)\]\((?<linklink>[^)]+)\)|\n/g, (m, ...others) => {
      if (m === '\n') {
        values.push(html`<br />`);
        return splitter;
      }
      const { stars, starcontent, linktext, linklink, h, hcontent } = others.at(-1) ?? {};
      if (stars) {
        switch (stars.length) {
          case 1:
            values.push(html`<em>${starcontent}</em>`);
            break;
          case 2:
            values.push(html`<strong>${starcontent}</strong>`);
            break;
          case 3:
            values.push(html`<strong><em>${starcontent}</em></strong>`);
            break;
        }
      }
      if (linktext) {
        values.push(html`<a href=${linklink}>${linktext}</a>`);
      }
      if (h) {
        switch (h.length) {
          case 1:
            values.push(html`<h1>${hcontent}</h1>`);
            break;
          case 2:
            values.push(html`<h2>${hcontent}</h2>`);
            break;
          case 3:
            values.push(html`<h3>${hcontent}</h3>`);
            break;
          case 4:
            values.push(html`<h4>${hcontent}</h4>`);
            break;
          case 5:
            values.push(html`<h5>${hcontent}</h5>`);
            break;
          case 6:
            values.push(html`<h6>${hcontent}</h6>`);
            break;
        }
      }
      return splitter;
    })
    .split(splitter);
}
