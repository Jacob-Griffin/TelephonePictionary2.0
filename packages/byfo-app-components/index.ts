import { css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html } from './src/utils/byfoHtml';
import { ByfoIcon } from './src/components/functional/Icon';
import { ByfoMarkdown } from './src/components/functional/Markdown';
import { installRootStyles } from '@byfo/themes';
import { BYFOStore } from 'byfo-utils/storage';

const store = new BYFOStore();
@customElement('byfo-testpage')
export default class BYFOTestpage extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    if (this.shadowRoot) {
      installRootStyles(this.shadowRoot);
    }
  }
  formFields = [
    {
      id: 'username',
      label: 'Name',
      initial: 'Jacob',
      validate: (v: string) => v.length > 0,
    },
    {
      id: 'gameid',
      label: 'Game ID',
      initial: '123456',
      validate: (v: string) => /\d{1,7}/.test(v),
    },
  ];
  markdownContent = `## Hello World
*Hello* **World**
Testing the ***markdown **stuff** ***
Including <script>console.error('uh oh');</script>,
Links, [this](https://google.com) or <a href="google.com">this</a>
### Mid-line headers
- Lists
- Done
- Normally
  - and
    - with
  - depth
and <style>p{color:red}</style>`;
  render() {
    return html`<h1>BYFO Component test page</h1>
      <byfo-canvas backupKey=${'testkey'}></byfo-canvas>
      <byfo-modal id='settings'><span slot="buttontext">${ByfoIcon('gear')}</span><byfo-settings slot="content" .store=${store}></byfo-settings></byfo-modal>
      <byfo-modal
        ><span slot="buttontext">Hello!</span>
        <byfo-form slot='content' heading='Join Game' .onSubmit=${() => console.log('yippee!')} .fields=${this.formFields} buttonLabel='Join'></byfo-modal
      >
      <div>${ByfoMarkdown(this.markdownContent, true)}<div>`;
  }

  static styles = [
    css`
      :host {
        box-sizing: border-box;
      }
      h1 {
        margin-top: 0;
        padding-top: 0.5em;
      }
      #settings::part(openbutton) {
        position: fixed;
        top: 0;
        right: 0;
        width: 4rem;
        height: 4rem;
        border-radius: 0 0 0 1rem;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-testpage': BYFOTestpage;
  }
  interface Window {
    byfoStore: BYFOStore;
  }
}
