import { installRootStyles } from '@byfo/themes';
import { CSSResultGroup, LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { buttonStyle } from '@byfo/components/styles';
import { consume } from '@lit/context';
import { firebaseContext, routeContext, storeContext } from '../context';
import { BYFOFirebaseAdapter, BYFOStore, RouteResult } from 'byfo-utils';

@customElement('byfo-app-review')
export class ByfoAppReview extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
  }
  @state() currentTab?: string;

  render() {
    return html`Review`;
  }
  @consume({ context: firebaseContext })
  firebase!: BYFOFirebaseAdapter;
  @consume({ context: storeContext })
  store!: BYFOStore;
  @consume({ context: routeContext })
  route!: RouteResult;

  static styles?: CSSResultGroup | undefined = [css``, buttonStyle];
}
