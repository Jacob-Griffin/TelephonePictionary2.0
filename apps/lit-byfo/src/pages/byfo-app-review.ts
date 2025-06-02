import { installRootStyles } from '@byfo/themes';
import { CSSResultGroup, LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { buttonStyle } from '@byfo/components/styles';
import { consume } from '@lit/context';
import { firebaseContext, routeContext, storeContext } from '../context';
import type { BYFOFirebaseAdapter, BYFOStore, GameStacks, Metadata, RouteResult } from '@byfo/utils';

@customElement('byfo-app-review')
export class ByfoAppReview extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    installRootStyles(this.shadowRoot!);
    this.firebase.getGameData(~~this.route.arg!).then(stacks => {
      this.stackData = stacks;
      if (this.metadata) {
        this.initializing = false;
      }
    });
    this.firebase.getGameMetadata(~~this.route.arg!).then(meta => {
      this.metadata = meta;
      if (this.stackData) {
        this.initializing = false;
      }
    });
  }
  @state() currentTab?: string;
  @state() stackData?: GameStacks;
  @state() metadata?: Metadata;
  @state() initializing = true;

  render() {
    return html` <h2>Game ${this.route.arg}</h2>
      ${this.initializing
        ? nothing
        : html`<byfo-review
            .stacks=${this.stackData ?? {}}
            selected=${this.route.query?.stack}
          ></byfo-review>`}`;
  }
  @consume({ context: firebaseContext })
  firebase!: BYFOFirebaseAdapter;
  @consume({ context: storeContext })
  store!: BYFOStore<ThemeId[]>;
  @consume({ context: routeContext })
  route!: RouteResult;

  static styles?: CSSResultGroup | undefined = [css``, buttonStyle];
}
