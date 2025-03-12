import { installRootStyles } from '@byfo/themes';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { Field } from '@byfo/components';
import { isValidGameId, isValidUsername } from 'byfo-utils';
import { useInjection } from '../utils/use-injection';

type FormType = 'join' | 'host' | 'review' | 'search';
type Form = { action: (v: Record<string, string>) => void; fields: Field[] };
type FormMap = Record<FormType, Form>;
@customElement('byfo-app-home')
export class ByfoAppHome extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    this.forms = this.createForms();
  }

  injected = useInjection(this, ['store', 'firebase']);

  forms?: FormMap;
  createForms: () => FormMap = () => ({
    join: {
      action: async values => {
        const response = await this.injected.firebase!.addPlayerToLobby(~~values.gameid, values.username);
        if (response.action === 'error') {
          throw new Error(response.detail);
        }
      },
      fields: [
        {
          label: 'Name',
          id: 'username',
          validate: isValidUsername,
          initial: this.injected.store?.username ?? '',
        },
        {
          label: 'Game ID',
          id: 'gameid',
          validate: isValidGameId,
          initial: this.injected.store?.gameid ?? '',
        },
      ],
    },
    host: {
      action: async values => {
        const id = await this.injected.firebase?.createGame(values.username);
        if (id) {
          this.dispatchEvent(new CustomEvent('byforedirect', { detail: { route: 'lobby', arg: id }, bubbles: true }));
        }
      },
      fields: [
        {
          label: 'Name',
          id: 'username',
          validate: isValidUsername,
          initial: this.injected.store?.username ?? '',
        },
      ],
    },
    review: {
      action: values => {
        console.log(values);
      },
      fields: [
        {
          label: 'Game ID',
          id: 'gameid',
          validate: isValidGameId,
          initial: this.injected.store?.gameid ?? '',
        },
      ],
    },
    search: {
      action: values => {
        console.log(values.query);
      },
      fields: [
        {
          id: 'query',
          validate: val => val.length > 0,
          initial: '',
        },
      ],
    },
  });

  render() {
    if (!this.forms) {
      this.forms = this.createForms();
    }
    return html`<div id="icon-row">
        <div id="icon-spacer"></div>
        <div id="main-icon"></div>
      </div>
      <section id="route-buttons">
        <byfo-modal id="join" class="important"
          ><span slot="buttontext">Join Game</span
          ><byfo-form slot="content" heading="Join a game" buttonLabel="Join" .fields=${this.forms.join.fields} .onSubmit=${this.forms.join.action}></byfo-form
        ></byfo-modal>
        <byfo-modal id="host"
          ><span slot="buttontext">Host Game</span
          ><byfo-form slot="content" heading="Host a game" buttonLabel="Host" .fields=${this.forms.host.fields} .onSubmit=${this.forms.host.action}></byfo-form
        ></byfo-modal>
        <byfo-modal id="review"
          ><span slot="buttontext">Review Finished Game</span
          ><byfo-form slot="content" heading="Review a finished game" buttonLabel="Review" .fields=${this.forms.review.fields} .onSubmit=${this.forms.review.action}></byfo-form
        ></byfo-modal>
        <byfo-modal id="search"
          ><span slot="buttontext">Search Games</span
          ><byfo-form slot="content" heading="Search games" buttonLabel="Search" .fields=${this.forms.search.fields} .onSubmit=${this.forms.search.action}></byfo-form
        ></byfo-modal>
      </section>`;
  }

  static styles = css`
    :host {
      display: block;
    }
    #test {
      height: 5rem;
      background-color: red;
      width: var(--icon-offset);
    }
    #icon-row {
      margin-top: 5vh;
      height: 40vh;
      align-items: stretch;
      display: flex;
    }
    #main-icon {
      flex-grow: 1;
      background-image: var(--byfo-image-icon);
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
    }
    #icon-spacer {
      width: calc(10% - 64px);
      max-width: 64px;
    }
    #route-buttons {
      padding: 1rem;
      place-self: stretch;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      byfo-modal {
        &::part(openbutton) {
          font-size: 1.5rem;
          padding: 1rem;
          height: 4rem;
          width: 100vw;
          max-width: 24rem;
          border-radius: 1rem;
        }
        &::part(dialog) {
          width: 40rem;
          max-width: 95vw;
          padding-block: 1.5rem;
          box-sizing: border-box;
          --form-row-gap: 1.5rem;
        }
      }
      .important::part(openbutton) {
        background-color: var(--byfo-color-important);
      }

      byfo-form::part(submit-button),
      .search-button {
        padding-inline: 1rem;
        font-size: 1.5rem;
        width: 80vw;
        max-width: 15rem;
      }
    }
    h1 {
      margin: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-app-home': ByfoAppHome;
  }
}
