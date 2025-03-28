import { html as litHtml } from 'lit';

export const html: typeof litHtml = (template, ...values) => {
  const els = template.join('').matchAll(/<(?<tag>byfo-[a-z-]+)/gu);
  for (const match of els) {
    const { tag } = match.groups ?? {};
    preload(tag);
  }
  return litHtml(template, ...values);
};

export const preload = (...tagnames: string[]): void => {
  for (const tag of tagnames) {
    if (tag?.startsWith('byfo-') && !window.customElements.get(tag)) {
      const extension = import.meta.url.includes('/dist') ? '.js' : '.ts';
      import(`../components/${tag}${extension}`);
    }
  }
};
