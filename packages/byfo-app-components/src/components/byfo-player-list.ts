import { css, LitElement, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement } from '../utils/byfoCustomElement';
import { html } from '../utils/byfoHtml';
import { BYFOConfig, decodePath, sortNames, sortNamesBy, type PlayerList } from 'byfo-utils';
import { property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import backdropStyle from '../styles/backdrop.style';

@customElement('byfo-player-list')
export default class BYFOPlayerList extends LitElement {
  @property() players?: PlayerList;
  @property() statusMap?: Record<string, boolean>;
  @property() config?: BYFOConfig;
  @property() countPlayers?: boolean;

  displayItems: TemplateResult[] = [];

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('players') || _changedProperties.has('statusMap')) {
      if (this.players) {
        const newlist = [];
        for (const id in this.players) {
          if (id === '__host') {
            continue;
          }
          newlist.push(decodePath(this.players[id].username));
        }
        this.displayItems = sortNames(newlist).map(n => html`<p>${n}</p>`);
      } else if (this.statusMap) {
        const newlist = [];
        // TODO Sorting
        const sorted = sortNamesBy(Object.entries(this.statusMap), 0);
        for (const [name, ready] of sorted) {
          newlist.push(html`<p class=${ready ? 'ready' : 'waiting'}>${ready ? '✓' : '•'}</p>`);
          newlist.push(html`<p>${decodePath(name)}</p>`);
        }
        this.displayItems = newlist;
      } else {
        this.displayItems = [];
      }
    }
  }

  formatLimit() {
    const { minPlayers, maxPlayers } = this.config ?? {};
    if (minPlayers && this.displayItems.length < minPlayers) {
      return html`(req. ${minPlayers})`;
    }
    if (maxPlayers) {
      return html`(max. ${maxPlayers})`;
    }
    return html``;
  }

  renderPlayers() {
    return html`<section class=${this.players ? '' : 'with-status'}>${map(this.displayItems, v => v)}</section>`;
  }

  render() {
    if (this.displayItems.length === 0) {
      return html`<section></section>`;
    }
    const l = this.displayItems.length;
    return html`<p class="info"><slot name="pretext"></slot></p>
      ${this.renderPlayers()} ${this.countPlayers ? html`<p class="info">${l} player${l !== 1 ? 's' : ''} in game ${this.formatLimit()}</p>` : nothing}`;
  }

  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 15rem;
        max-width: min(30rem, 100%);
        gap: 0.5rem;
      }
      p {
        margin: 0;
        height: fit-content;
        font-size: 1.2rem;
      }
      section {
        width: 100%;
        place-content: center;
        display: grid;
        grid-template-columns: max-content;
        grid-auto-flow: row;
        grid-auto-rows: 2.25rem;
      }
      section.with-status {
        grid-template-columns: 2ch max-content;
        grid-auto-flow: column row;
        column-gap: 1rem;
      }
      .ready {
        text-align: center;
        color: green;
      }
      .waiting {
        text-align: center;
        color: orange;
      }
      .info {
        opacity: 0.7;
        font-size: 0.9rem;
        text-align: center;
      }
    `,
    backdropStyle,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-player-list': BYFOPlayerList;
  }
}
