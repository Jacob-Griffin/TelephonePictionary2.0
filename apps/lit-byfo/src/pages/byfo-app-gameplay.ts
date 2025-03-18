import { installRootStyles } from '@byfo/themes';
import { LitElement, TemplateResult, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  BYFOFirebaseAdapter,
  BYFOGameState,
  BYFOStore,
  emitRedirect,
  GameStateError,
  RouteResult,
  StaticRoundInfo,
} from 'byfo-utils';
import { choose } from 'lit/directives/choose.js';
import { consume } from '@lit/context';
import { firebaseContext, routeContext, storeContext } from '../context';
import { backdropStyle, buttonStyle, ByfoCard, cardStyles, inputStyle } from '@byfo/components';

/**
 * The minimum amount of pixels wide where the canvas controls move to the right
 */
const sideBySideThreshold = 1125;

@customElement('byfo-app-gameplay')
export class ByfoAppGameplay extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    this.state = new BYFOGameState(this.firebase, this.route.arg, this.store.username);
    this.state
      .initialize()
      .catch(e => {
        if (e instanceof GameStateError) {
          emitRedirect(this, { route: e.destination, arg: e.destinationArg });
        }
      })
      .then(() => (this.staticRoundInfo = this.state?.staticRoundInfo));
    this.state?.on('currentTimeRemaining', t => this.handleTime(t));
    this.state?.on('state', newState => {
      if (newState === 'finished') {
        this.store?.setGameid(null);
        this.store?.setUsername(null);
        emitRedirect(this, { route: 'review', arg: this.route.arg });
        return;
      }
      this.requestUpdate();
    });
    this.state?.on('recievedCard', () => this.requestUpdate());
    this.watchMode.observe(this);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.watchMode.disconnect();
  }

  @state() canvasClass = '';
  watchMode = new ResizeObserver(entries => {
    const entry = entries.at(-1)!;
    const { inlineSize } = entry.contentBoxSize[0];
    if (inlineSize > sideBySideThreshold && this.canvasClass === '') {
      this.canvasClass = 'side-by-side';
    }
    if (inlineSize <= sideBySideThreshold && this.canvasClass === 'side-by-side') {
      this.canvasClass = '';
    }
  });

  @state() timeLeft?: number;
  @state() staticRoundInfo?: StaticRoundInfo;

  @consume({ context: firebaseContext })
  firebase!: BYFOFirebaseAdapter;
  @consume({ context: storeContext })
  store!: BYFOStore;
  @consume({ context: routeContext })
  route!: RouteResult;
  state?: BYFOGameState;

  handleTime(t?: number) {
    if (t === undefined) {
      return;
    }
    this.timeLeft = t / 1000;
  }

  renderFrom() {
    const card = this.state?.recievedCard;
    const cnode = card ? ByfoCard(card.content!, card.contentType, this.state!.from, 'left') : '';
    return html`${cnode}
      <section class="backdrop">
        <h4>Sending to: <strong>${this.state?.to}</strong></h4>
      </section>`;
  }

  renderTimer(backdrop?: boolean) {
    if (!this.timeLeft) {
      return nothing;
    }
    if (this.timeLeft < 0) {
      return "Time's up!";
    }
    const t = this.state!.timeRemainingString ?? '-:--';
    return backdrop ? html`<section class="backdrop timer">${t}</section>` : t;
  }
  renderDrawingRound() {
    return html`${this.renderFrom()}
      <byfo-canvas class=${this.canvasClass} .gameState=${this.state}></byfo-canvas>`;
  }
  renderWritingRound() {
    return html`${this.renderFrom()} ${this.renderTimer(true)}
      <byfo-writing-input .gameState=${this.state}></byfo-writing-input>`;
  }
  renderWaiting() {
    return html`${this.renderTimer(true)}
      <byfo-player-list class="backdrop" .statusMap=${this.state!.playersReady}
        ><span slot="pretext">Waiting for players</span></byfo-player-list
      >`;
  }

  render() {
    const stateMap: [BYFOGameState['state'], () => TemplateResult][] = [
      ['writing', this.renderWritingRound.bind(this)],
      ['drawing', this.renderDrawingRound.bind(this)],
      ['waiting', this.renderWaiting.bind(this)],
    ];
    return html`<section class="content">
      <h2>Round ${(this.state?.round ?? 0) + 1}/${(this.staticRoundInfo?.lastRound ?? 0) + 1}</h2>
      ${choose(this.state?.state, stateMap, () => html``)}
    </section>`;
  }

  static styles = [
    backdropStyle,
    css`
      :host {
        width: 100%;
        max-width: 1600px;
        height: 100%;
        padding-inline: 5vw;
        box-sizing: border-box;
      }
      section.timer {
        padding: 0.5rem;
        width: min-content;
      }
      h2 {
        margin: 0;
      }
      section.content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding-top: calc(2rem + var(--header-size));
        box-sizing: border-box;
        width: 100%;
        height: 100%;
      }
      .card {
        width: 100%;
        max-width: 1000px;
        &.image {
          max-width: fit-content;
        }
      }
      section:has(h4) {
        margin: -0.25rem;
        h4 {
          margin: 0;
        }
      }
    `,
    buttonStyle,
    cardStyles,
    inputStyle,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-gameplay': ByfoAppGameplay;
  }
}
