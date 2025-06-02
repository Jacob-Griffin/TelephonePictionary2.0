import { css, LitElement } from 'lit';
import { customElement } from '../utils/byfoCustomElement';
import { html } from '../utils/byfoHtml';
import { property, state } from 'lit/decorators.js';
import { decodePath, GameStacks, sortNameMap } from '@byfo/utils';

@customElement('byfo-review')
export default class BYFOReview extends LitElement {
  @property() stacks?: GameStacks;

  @property({ reflect: true }) selected?: string;
  @state() selectedData?: GameStacks[string];

  get stackData() {
    return sortNameMap(this.stacks ?? {});
  }

  handleStackClick(stack: string) {
    this.selected = stack;
    this.selectedData = this.stacks?.[stack];
    window.location.hash = `stack=${stack}`;
  }

  renderStackButton([stackName, _]: [string, unknown]) {
    return html`<button
      @click=${() => this.handleStackClick(stackName)}
      class=${this.selected === stackName ? 'selected' : ''}
    >
      ${decodePath(stackName)}
    </button>`;
  }

  renderStack(stackName?: string) {
    return html`${stackName ? html`<p>${decodePath(stackName)}'s Stack</p>` : html`<p>Select a stack</p>`}`;
  }

  render() {
    return html`<div>${this.stackData.map(stack => this.renderStackButton(stack))}</div>
      <section>${this.renderStack(this.selected)}</section>`;
  }

  static styles = [css``];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-review': BYFOReview;
  }
}
