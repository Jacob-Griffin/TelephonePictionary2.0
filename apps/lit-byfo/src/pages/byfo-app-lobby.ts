import { installRootStyles } from '@byfo/themes';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { useInjection } from '../utils/use-injection';
import { emitRedirect, GameStatus, PlayerList, RouteInfo } from 'byfo-utils';
import { buttonStyle, inputStyle } from '@byfo/components/styles';

const nop = () => {};

@customElement('byfo-app-lobby')
export class ByfoAppLobby extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    this.route = this.injected.getRoute!();
    this.unsubs.list = this.injected.firebase!.onPlayerListChange(~~this.route.arg!, this.onPlayerList) ?? nop;
    this.unsubs.status = this.injected.firebase!.onGameStatusChange(~~this.route.arg!, this.onStatusChange) ?? nop;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const fn in this.unsubs) {
      this.unsubs[fn]();
    }
  }

  unsubs: Record<string, () => void> = {
    list: nop,
    status: nop,
  };

  @state() players!: PlayerList;
  @state() showCopied: boolean = false;
  @state() canHost: boolean = false;

  copiedTimeout?: number;

  /**
   * Time per round (in milliseconds)
   */
  #time: number = 180000;
  /**
   * Time per round (in milliseconds)
   */
  get time() {
    return this.#time;
  }
  /**
   * Time per round (in milliseconds)
   */
  set time(v) {
    if (typeof v === 'number') {
      this.#time = v;
    } else {
      this.#time = -1;
    }
    this.checkHosting();
  }

  get hosting() {
    if (!this.players || !this.injected.store) {
      return false;
    }
    return this.players?.__host.username === this.injected.store?.username;
  }

  get config() {
    return this.injected.firebase?.gameConfig;
  }

  checkHosting() {
    const timeValid = !!this.injected.firebase?.isValidTime(this.time);
    const playersValid = !!this.injected.firebase?.isValidPlayerList(this.players);
    this.canHost = timeValid && playersValid && this.hosting;
  }

  onPlayerList = (list: PlayerList) => {
    this.players = list;
    this.checkHosting();
  };

  onStatusChange = ({ started }: GameStatus) => {
    if (started) {
      emitRedirect(this, { route: 'game', arg: this.route!.arg });
    }
  };

  handleTimeInput = (e: InputEvent) => {
    const value = (e.target as HTMLInputElement).value;
    if (value === '') {
      this.time = Number.POSITIVE_INFINITY;
      return;
    }
    const { minutes, seconds }: Record<string, string | number> = value.match(/^(?:(?<minutes>\d+)m)?(?:(?<seconds>\d+)s)?$/)?.groups ?? {};
    if (!minutes && !seconds) {
      this.time = -1;
      return;
    }
    if (minutes && ~~seconds >= 60) {
      this.time = -1;
      return;
    }
    const time = ~~seconds * 1000 + ~~minutes * 60000;
    this.time = time;
  };

  startGame() {
    if (!this.canHost) {
      return;
    }
    this.injected.firebase!.beginGame(~~this.route.arg!, this.time);
  }

  copyJoinLink() {
    const link = `https://${location.origin}/join/${this.route.arg}`;
    navigator.clipboard.writeText(link);
    this.showCopied = true;
    clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => {
      this.showCopied = false;
    }, 2000);
  }

  injected = useInjection(this, ['store', 'firebase', 'getRoute']);
  route: RouteInfo = { route: 'lobby', arg: '' };

  render() {
    return html`<h2>Game ${this.route.arg}</h2>
      <button @click=${this.copyJoinLink} ?active=${this.showCopied}>${this.showCopied ? '✓ Copied!' : '📋 Copy invite link'}</button>
      <byfo-player-list .players=${this.players} .config=${this.config}></byfo-player-list>
      ${this.hosting
        ? html`<p>Round Length</p>
            <input type="text" placeholder="∞" value="3m" @input=${this.handleTimeInput} />
            <button class="big" @click=${this.startGame} ?disabled=${!this.canHost}>Start Game</button>`
        : nothing}`;
  }

  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
      }
      .copied {
        back
      }
      h2, p {
        margin: 0;
      }
      input {
        text-align: center;
      }
    `,
    buttonStyle,
    inputStyle,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-lobby': ByfoAppLobby;
  }
}
