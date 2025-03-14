import { installRootStyles } from '@byfo/themes';
import { LitElement, TemplateResult, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BYFOGameState, emitRedirect, GameStateError } from 'byfo-utils';
import { useInjection } from '../utils/use-injection';
import { choose } from 'lit/directives/choose.js';

@customElement('byfo-app-gameplay')
export class ByfoAppGameplay extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    const route = this.injected.getRoute!();
    this.state = new BYFOGameState(this.injected.firebase!, route.arg, this.injected.store!.username);
    this.state.initialize().catch(e => {
      if (e instanceof GameStateError) {
        emitRedirect(this, { route: e.destination, arg: e.destinationArg });
      }
    });
    this.state?.on('currentTimeRemaining', t => this.handleTime(t));
  }

  @state() timeLeft: number = -1;

  injected = useInjection(this, ['store', 'firebase', 'getRoute']);
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
      return html`Time's up!`;
    }
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = Math.floor(this.timeLeft % 60)
      .toString()
      .padStart(2, '0');
    return html`${minutes}:${seconds}`;
  }
  renderDrawingRound() {
    return html`<h2>Drawing ${this.renderTimer()}</h2>`;
  }
  renderWritingRound() {
    return html`<h2>Writing ${this.renderTimer()}</h2>`;
  }
  renderWaiting() {
    return html`<h2>Waiting ${this.renderTimer()}</h2>`;
  }

  render() {
    const stateMap: [BYFOGameState['state'], () => TemplateResult][] = [
      ['writing', this.renderWritingRound.bind(this)],
      ['drawing', this.renderDrawingRound.bind(this)],
      ['waiting', this.renderWaiting.bind(this)],
    ];
    return html`${choose(this.state?.state, stateMap, () => html``)}`;
  }

  static styles = css``;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-gameplay': ByfoAppGameplay;
  }
}
