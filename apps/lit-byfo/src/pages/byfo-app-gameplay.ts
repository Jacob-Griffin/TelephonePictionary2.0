import { installRootStyles } from '@byfo/themes';
import { LitElement, TemplateResult, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BYFOFirebaseAdapter, BYFOGameState, BYFOStore, emitRedirect, GameStateError, RouteResult } from 'byfo-utils';
import { choose } from 'lit/directives/choose.js';
import { consume } from '@lit/context';
import { firebaseContext, routeContext, storeContext } from '../context';
import { buttonStyle } from '@byfo/components';

@customElement('byfo-app-gameplay')
export class ByfoAppGameplay extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    this.state = new BYFOGameState(this.firebase, this.route.arg, this.store.username);
    this.state.initialize().catch(e => {
      if (e instanceof GameStateError) {
        emitRedirect(this, { route: e.destination, arg: e.destinationArg });
      }
    });
    this.state?.on('currentTimeRemaining', t => this.handleTime(t));
  }

  @state() timeLeft: number = -1;

  @consume({ context: firebaseContext })
  firebase!: BYFOFirebaseAdapter;
  @consume({ context: storeContext })
  store!: BYFOStore;
  @consume({ context: routeContext })
  route!: RouteResult;
  state?: BYFOGameState;

  handleTime(t?: number) {
    this.timeLeft = (t ?? -1000) / 1000;
    if (this.timeLeft < 0 && !this.state?.submitting) {
      this.submit();
    }
  }

  submit() {
    if (!this.state) {
      return;
    }
    const content = this.state.state === 'writing' ? this.fetchText() : this.fetchImage();
    this.state.submitRound(content);
  }

  fetchText(): string | undefined {
    return;
  }

  fetchImage(): string | undefined {
    return;
  }

  renderTimer() {
    if (this.timeLeft < 0) {
      return "Time's up!";
    }
    return this.state!.timeRemainingString;
  }
  renderDrawingRound() {
    return html`<h2>Drawing ${this.renderTimer()}</h2>`;
  }
  renderWritingRound() {
    return html`<h2>Writing ${this.renderTimer()}</h2>
      <button @click=${this.submit}>Submit</button>`;
  }
  renderWaiting() {
    return html`<byfo-player-list .statusMap=${this.state!.playersReady} />`;
  }

  render() {
    const stateMap: [BYFOGameState['state'], () => TemplateResult][] = [
      ['writing', this.renderWritingRound.bind(this)],
      ['drawing', this.renderDrawingRound.bind(this)],
      ['waiting', this.renderWaiting.bind(this)],
    ];
    return html`${choose(this.state?.state, stateMap, () => html``)}`;
  }

  static styles = [css``, buttonStyle];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-gameplay': ByfoAppGameplay;
  }
}
