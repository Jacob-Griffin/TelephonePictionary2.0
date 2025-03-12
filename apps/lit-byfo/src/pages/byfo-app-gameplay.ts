import { installRootStyles } from '@byfo/themes';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BYFOGameState, GameStateError } from 'byfo-utils';
import { useInjection } from '../utils/use-injection';

@customElement('byfo-app-gameplay')
export class ByfoAppGameplay extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    const route = this.injected.getRoute!();
    try {
      this.state = new BYFOGameState(this.injected.firebase!, route.arg, this.injected.store!.username);
    } catch (e) {
      if (e instanceof GameStateError) {
        this.dispatchEvent(new CustomEvent('byforedirect', { detail: { route: e.destination, arg: e.destinationArg } }));
      }
    }
  }

  injected = useInjection(this, ['store', 'firebase', 'getRoute']);
  state?: BYFOGameState;

  render() {
    return html``;
  }

  static styles = css``;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-gameplay': ByfoAppGameplay;
  }
}
