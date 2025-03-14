import { installRootStyles } from '@byfo/themes';
import { CSSResultGroup, LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { buttonStyle } from '@byfo/components/styles';
import { firebaseContext, routeContext, storeContext } from '../context';
import { isValidUsername, type RouteResult, type BYFOFirebaseAdapter, type BYFOStore, emitRedirect } from 'byfo-utils';
import { consume } from '@lit/context';

@customElement('byfo-app-join')
export class ByfoAppJoin extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
  }

  @consume({ context: firebaseContext })
  firebase!: BYFOFirebaseAdapter;
  @consume({ context: storeContext })
  store!: BYFOStore;
  @consume({ context: routeContext })
  route!: RouteResult;

  joinFields: Field[] = [
    {
      label: 'Name',
      id: 'username',
      validate: isValidUsername,
      initial: this.store?.username ?? '',
    },
  ];
  join = async (values: Record<string, string>) => {
    const response = await this.firebase.addPlayerToLobby(~~this.route.arg!, values.username);
    if (response.action === 'error') {
      throw new Error(response.detail);
    }
    this.store.setGameid(this.route.arg!);
    this.store.setUsername(values.username);
    emitRedirect(this, { route: response.dest!, arg: this.route.arg });
  };

  render() {
    return html`<byfo-form class="backdrop" heading=${`Join game ${this.route.arg}`} buttonLabel="Join" .fields=${this.joinFields} .onSubmit=${this.join}></byfo-form>`;
  }

  static styles?: CSSResultGroup | undefined = [
    css`
      byfo-form {
        padding-block: 1rem;
      }
    `,
    buttonStyle,
  ];
}
