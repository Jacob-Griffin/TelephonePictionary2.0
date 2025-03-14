import { installRootStyles } from '@byfo/themes';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { emitRedirect, isValidGameId, isValidUsername, type BYFOFirebaseAdapter, type BYFOStore } from 'byfo-utils';
import { firebaseContext, storeContext } from '../context';
import { consume } from '@lit/context';

type Form = { action: (v: Record<string, string>) => void; fields: Field[] };

@customElement('byfo-app-home')
export class ByfoAppHome extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
  }

  @consume({ context: firebaseContext })
  firebase!: BYFOFirebaseAdapter;
  @consume({ context: storeContext })
  store!: BYFOStore;

  forms: Record<string, Form> = {
    join: {
      action: async values => {
        const response = await this.firebase.addPlayerToLobby(~~values.gameid, values.username);
        if (response.action === 'error') {
          throw new Error(response.detail);
        }
        if (values.gameid) {
          this.store.setGameid(values.gameid);
        }
        if (values.username) {
          this.store.setUsername(values.username);
        }
        emitRedirect(this, { route: response.dest!, arg: values.gameid });
      },
      fields: [
        {
          label: 'Name',
          id: 'username',
          validate: isValidUsername,
          initial: this.store?.username ?? '',
        },
        {
          label: 'Game ID',
          id: 'gameid',
          validate: isValidGameId,
          initial: this.store?.gameid ?? '',
        },
      ],
    },
    host: {
      action: async values => {
        const id = await this.firebase.createGame(values.username);
        if (id) {
          if (values.username) {
            this.store.setUsername(values.username);
          }
          this.store.setGameid(id);
          emitRedirect(this, { route: 'lobby', arg: id });
        }
      },
      fields: [
        {
          label: 'Name',
          id: 'username',
          validate: isValidUsername,
          initial: this.store?.username ?? '',
        },
      ],
    },
    review: {
      action: async values => {
        const status = await this.firebase.getGameStatus(~~values.gameid);
        if (!status) {
          throw new Error(`Game ${values.gameid} does not exist`);
        }
        if (!status?.finished) {
          throw new Error(`Game ${values.gameid} is not finished`);
        }
        emitRedirect(this, { route: 'review', arg: values.gameid });
      },
      fields: [
        {
          label: 'Game ID',
          id: 'gameid',
          validate: isValidGameId,
          initial: '',
        },
      ],
    },
    search: {
      action: values => {
        emitRedirect(this, { route: 'review', arg: values.query });
      },
      fields: [
        {
          id: 'query',
          validate: val => val.length > 0,
          initial: '',
        },
      ],
    },
  };

  render() {
    return html`<div id="icon-row">
        <div id="icon-spacer"></div>
        <div id="main-icon"></div>
      </div>
      <section id="route-buttons">
        <byfo-modal id="join" class="important big-button"
          ><span slot="buttontext">Join Game</span
          ><byfo-form slot="content" heading="Join a game" buttonLabel="Join" .fields=${this.forms.join.fields} .onSubmit=${this.forms.join.action}></byfo-form
        ></byfo-modal>
        <byfo-modal id="host" class="big-button"
          ><span slot="buttontext">Host Game</span
          ><byfo-form slot="content" heading="Host a game" buttonLabel="Host" .fields=${this.forms.host.fields} .onSubmit=${this.forms.host.action}></byfo-form
        ></byfo-modal>
        <byfo-modal id="review" class="big-button"
          ><span slot="buttontext">Review Finished Game</span
          ><byfo-form slot="content" heading="Review a finished game" buttonLabel="Review" .fields=${this.forms.review.fields} .onSubmit=${this.forms.review.action}></byfo-form
        ></byfo-modal>
        <byfo-modal id="search" class="big-button"
          ><span slot="buttontext">Search Games</span
          ><byfo-form slot="content" heading="Search games" buttonLabel="Search" .fields=${this.forms.search.fields} .onSubmit=${this.forms.search.action}></byfo-form
        ></byfo-modal>
      </section>`;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    #icon-row {
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
