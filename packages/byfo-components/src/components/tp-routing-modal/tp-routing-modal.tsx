import { Component, h, Prop, Element, State, Watch } from '@stencil/core';
import { renderModal } from '../../globals/modal';
import { createModal, ModalContent } from './content';
import { BYFOFirebaseAdapter } from 'byfo-utils';
import type { RejoinData } from 'byfo-utils';

@Component({
  tag: 'tp-routing-modal',
  styleUrl: 'tp-routing-modal.css',
  shadow: true,
})
export class TpRoutingModal {
  @Prop({ reflect: true, attribute: 'modal-enabled' }) enabled: boolean;
  @Prop({ reflect: true, attribute: 'modal-type' }) type: 'host' | 'join' | 'result' | undefined;
  @Prop() firebase: BYFOFirebaseAdapter;
  @Prop() rejoin?: RejoinData | null;

  @State() contentModel: ModalContent = null;
  @State() toggleToRerender: boolean = false;
  @Element() el;

  pendingRejoin: boolean = false;

  get root() {
    return this.el.shadowRoot;
  }

  keyHandler = event => {
    if (event.key !== 'Enter') return;
    this.contentModel?.actionClick();
  };
  connectedCallback() {
    document.addEventListener('keydown', this.keyHandler);
  }

  @Watch('type')
  switchContent(newValue, oldValue) {
    if (!newValue) {
      this.contentModel = null;
      return;
    }
    if (newValue === oldValue) {
      return;
    }
    this.contentModel = createModal(newValue, this.rerender, this.firebase);
    if (this.rejoin && newValue === 'join') {
      const { gameid, name } = this.rejoin;
      this.contentModel.fieldValues = { gameid, name };
      this.contentModel.actionError = 'Populated from incomplete game';
      this.pendingRejoin = true;
    }
  }

  rerender = () => {
    this.toggleToRerender = !this.toggleToRerender;
  };

  renderBody() {
    return this.contentModel?.render() ?? [<p>Error: missing modal content</p>];
  }

  render() {
    return renderModal(this);
  }

  componentDidUpdate() {
    if (this.pendingRejoin && this.rejoin) {
      this.root.getElementById('gameid').value = this.rejoin.gameid;
      this.root.getElementById('name').value = this.rejoin.name;
      this.pendingRejoin = false;
    }
  }
}
