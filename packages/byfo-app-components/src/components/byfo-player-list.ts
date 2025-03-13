import { css, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement } from '../utils/byfoCustomElement';
import { html } from '../utils/byfoHtml';
import { BYFOConfig, sortNames, sortNamesBy, type PlayerList } from 'byfo-utils';
import { property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

@customElement('byfo-player-list')
export default class BYFOPlayerList extends LitElement {
  @property() players?: PlayerList;
  @property() statusMap?: Record<string, boolean>;
  @property() config?: BYFOConfig;

  displayItems: TemplateResult[] = [];

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('players') || _changedProperties.has('statusMap')) {
      if (this.players) {
        const newlist = [];
        for (const id in this.players) {
          if (id === '__host') {
            continue;
          }
          newlist.push(this.players[id].username);
        }
        this.displayItems = sortNames(newlist).map(n => html`<p>${n}</p>`);
      } else if (this.statusMap) {
        const newlist = [];
        // TODO Sorting
        const sorted = sortNamesBy(Object.entries(this.statusMap), 0);
        for (const [name, ready] of sorted) {
          newlist.push(html`<p>${name}</p>`);
          newlist.push(html`<p class=${ready ? 'ready' : 'waiting'}>${ready ? '✓' : '•'}</p>`);
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
    if (this.players) {
      const l = this.displayItems.length;
      return html`<p class="info">Waiting for players. Invite players with the game number or by sharing the join link above</p>
        ${this.renderPlayers()}
        <p class="info">${l} player${l !== 1 ? 's' : ''} in game ${this.formatLimit()}</p>`;
    }
    return html`${this.renderPlayers()}`;
  }

  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: min(30rem, 100%);
        background-color: var(--byfo-color-backdrop);
        border-radius: 1rem;
        padding: 0.5rem 2rem;
      }
      section {
        width: 100%;
        place-content: center;
        display: grid;
        grid-template-columns: max-content;
        grid-auto-flow: row;
        grid-auto-rows: 2rem;
        p {
          margin: 0;
          height: fit-content;
        }
      }
      .info {
        opacity: 0.7;
        font-size: 0.9rem;
        text-align: center;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-player-list': BYFOPlayerList;
  }
}
