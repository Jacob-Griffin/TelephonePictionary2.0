import { LitElement, PropertyValues, TemplateResult, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from '../utils/byfoCustomElement';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { html } from '../utils/byfoHtml';
import { BYFOCanvasState } from 'byfo-utils';
import { map } from 'lit/directives/map.js';

import { ByfoIcon } from './functional/Icon';

import buttonStyles from '../styles/button.style';
import { applicationRules } from '@byfo/themes';
import { backdropStyle } from '../styles';

const internalWidth = 1000;
const internalHeight = 600;
const buttonSizeRem = 4.5;
const gapRem = 1;
const buttonGroupRem = 2 * buttonSizeRem + gapRem;

@customElement('byfo-canvas')
export class BYFOCanvas extends LitElement {
  #canvas: Ref<HTMLCanvasElement> = createRef();
  get canvas() {
    return this.#canvas.value!;
  }
  box?: DOMRect;
  state?: BYFOCanvasState;

  @property() backupKey?: string;
  get backup() {
    if (this.backupKey) {
      return {
        set: (data: string) => {
          if (!data) {
            localStorage.removeItem(this.backupKey!);
          }
          localStorage.setItem(this.backupKey!, data);
        },
        get: () => localStorage.getItem(this.backupKey!),
      };
    } else {
      return {
        set: (_data: string) => void null,
        get: () => null,
      };
    }
  }

  @property() submitText: string | TemplateResult = 'Submit';
  @property() onSubmit: () => unknown = () => {};
  @property() timeLeft: string = '-:--';

  async getImage() {
    return this.state?.getImage();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    const backupdata = this.backup.get() ?? undefined;
    this.state = new BYFOCanvasState(this.canvas, { internalHeight, internalWidth }, backupdata);
    this.state.on('backup', this.backup.set);
    this.state.on('currentWidth', v => (this.currentWidth = v));
    this.state.on('mode', v => (this.mode = v));
    this.mode = this.state.mode;
    this.currentWidth = this.state.currentWidth;
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.state?.cleanupInputs();
  }

  static buttons: ControlButton[][] = [
    [
      {
        icon: 'pencil',
        state: 'mode::draw',
        action: 'setDrawMode',
        arg: 'draw',
      },
      {
        icon: 'eraser',
        state: 'mode::erase',
        action: 'setDrawMode',
        arg: 'erase',
      },
    ],
    [
      {
        icon: 'undo',
        action: 'undo',
      },
      {
        icon: 'redo',
        action: 'redo',
      },
    ],
    [
      {
        icon: 'line',
        state: 'currentWidth::small',
        action: 'changeLine',
        arg: 'small',
      },
      {
        icon: 'line',
        state: 'currentWidth::medium',
        action: 'changeLine',
        arg: 'medium',
      },
    ],
    [
      {
        icon: 'line',
        state: 'currentWidth::large',
        action: 'changeLine',
        arg: 'large',
      },
      {
        icon: 'line',
        state: 'currentWidth::xlarge',
        action: 'changeLine',
        arg: 'xlarge',
      },
    ],
    [
      {
        icon: 'trash',
        action: 'clearCanvas',
        class: 'important',
      },
      {
        icon: 'swap',
        action: 'invert',
        class: 'invert-button',
      },
    ],
  ];

  @state() currentWidth?: string;
  @state() mode?: string;

  buttonAction = (action: ControlButton['action'], arg: ControlButton['arg']) => {
    return () => {
      if (!action || !this?.state) {
        return;
      }
      const fn = this.state[action] as (arg?: unknown) => void;
      if (typeof fn === 'function') {
        if (fn.length >= 1) {
          fn(arg);
        } else {
          fn();
        }
      }
    };
  };

  renderButton = (button: ControlButton) => {
    const state = button.state?.split('::') as [keyof BYFOCanvas, string] | undefined;
    return html`<button @click=${this?.buttonAction(button.action, button.arg)} active=${(state && this?.[state[0]] === state[1]) || nothing} class=${button.class}>
      ${ByfoIcon(button.icon, button.arg as string)}
    </button>`;
  };

  renderButtonGroup = (buttons: ControlButton[]) => {
    if (buttons.length === 1) {
      return this.renderButton(buttons[0]);
    }
    return html`<div class="button-group">${map(buttons, this.renderButton)}</div>`;
  };

  renderControls = () => {
    const buttons = (this.constructor as typeof BYFOCanvas).buttons;
    return html`<section class="controls">
      <section class="backdrop">${this.timeLeft}</section>
      ${map(buttons, this.renderButtonGroup)}<button @click=${this.onSubmit} class="wide">${this.submitText}</button>
    </section>`;
  };

  render() {
    return html`<canvas width=${internalWidth} height=${internalHeight} ${ref(this.#canvas)}></canvas>${this.renderControls()}`;
  }

  static styles = [
    css`
      :host {
        --grid-size: 1fr ${buttonGroupRem}rem;
        display: grid;
        column-gap: ${gapRem}rem;
        row-gap: ${gapRem}rem;
        max-width: ${internalWidth}px;
      }
      :host(.side-by-side) {
        grid-template-columns: var(--grid-size);
        grid-template-rows: unset;
        max-width: calc(${internalWidth}px + ${buttonGroupRem}rem + ${gapRem}rem);
        .controls {
          grid-template-rows: min-content repeat(${BYFOCanvas.buttons.length}, ${buttonSizeRem}rem);
          grid-template-columns: repeat(2, ${buttonSizeRem}rem);
          grid-auto-flow: row;
          div {
            grid-column-end: span 2;
          }
          section.backdrop {
            grid-column: span 2;
          }
          .wide {
            width: ${buttonGroupRem}rem;
            grid-column: span 2;
          }
        }
      }
      .controls {
        width: ${6 * buttonSizeRem + 5 * gapRem}rem;
        max-width: fit-content;
        align-self: center;
        justify-self: center;
        display: grid;
        grid-template-rows: min-content ${buttonSizeRem}rem ${buttonSizeRem}rem;
        grid-template-columns: repeat(3, ${buttonGroupRem}rem);
        column-gap: ${gapRem}rem;
        row-gap: ${gapRem}rem;
        grid-auto-flow: column dense;
        button {
          width: ${buttonSizeRem}rem;
          height: ${buttonSizeRem}rem;
        }
        section.backdrop {
          height: fit-content;
          width: fit-content;
          grid-row: 1;
          grid-column: span 3;
          align-self: center;
          justify-self: center;
        }
        .wide {
          width: ${buttonGroupRem}rem;
          font-size: 1.4rem;
        }
      }
      canvas {
        width: ${internalWidth}px;
        max-width: 100%;
        aspect-ratio: ${internalWidth} / ${internalHeight};
        border-radius: var(--border-radius-sm, 0.5rem);
        border: solid 1px var(--byfo-border, rgb(100, 116, 139));
      }
      .button-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 1rem;
        min-width: var(--grid-size);
      }
    `,
    buttonStyles,
    backdropStyle,
    applicationRules,
  ];
}

export default BYFOCanvas;

interface ControlButton {
  icon: Icon;
  class?: string;
  state?: `${keyof BYFOCanvasState}::${string}`;
  action: keyof BYFOCanvasState;
  arg?: unknown;
}

declare global {
  interface HTMLElementTagNameMap {
    'byfo-canvas': BYFOCanvas;
  }
}
