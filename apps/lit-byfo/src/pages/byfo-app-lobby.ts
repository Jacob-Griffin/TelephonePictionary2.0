import { installRootStyles } from '@byfo/themes';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { useInjection } from '../utils/use-injection';
import { PlayerList } from 'byfo-utils';

const nop = () => {};

@customElement('byfo-app-lobby')
export class ByfoAppLobby extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    const route = this.injected.getRoute!();
    console.log(this.injected.firebase);
    this.unsubs.list = this.injected.firebase!.onPlayerListChange(~~route.arg!, this.onPlayerList) ?? nop;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const fn in this.unsubs) {
      this.unsubs[fn]();
    }
  }

  @state() players: PlayerList = {};

  unsubs: Record<string, () => void> = {
    list: nop,
  };

  onPlayerList = (list: PlayerList) => {
    this.players = list;
  };

  injected = useInjection(this, ['store', 'firebase', 'getRoute']);

  render() {
    return html`<byfo-player-list .players=${this.players}></byfo-player-list>`;
  }

  static styles = css``;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-lobby': ByfoAppLobby;
  }
}
