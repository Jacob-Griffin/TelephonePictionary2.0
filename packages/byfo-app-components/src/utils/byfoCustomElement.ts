import { LitElement } from 'lit';

export function customElement(tagname: string) {
  return function decorate(definition: typeof LitElement) {
    if (window.customElements.get(tagname)) {
      return;
    }
    window.customElements.define(tagname, definition);
  };
}
