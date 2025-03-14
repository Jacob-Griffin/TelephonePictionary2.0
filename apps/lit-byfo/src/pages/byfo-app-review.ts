import { installRootStyles } from '@byfo/themes';
import { CSSResultGroup, LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { useInjection } from '../utils/use-injection';
import { buttonStyle } from '@byfo/components/styles';

@customElement('byfo-app-lobby')
export class ByfoAppLobby extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
  }
  @state() currentTab?: string;

  render() {
    return html`Review`;
  }

  injected = useInjection(this, ['firebase', 'store', 'getRoute']);

  static styles?: CSSResultGroup | undefined = [css``, buttonStyle];
}
