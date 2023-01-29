/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
export namespace Components {
    interface TpCanvas {
        "exportDrawing": () => Promise<unknown>;
        "height": number;
        "width": number;
    }
    interface TpCanvasControls {
    }
    interface TpInputZone {
        "round": number;
    }
}
declare global {
    interface HTMLTpCanvasElement extends Components.TpCanvas, HTMLStencilElement {
    }
    var HTMLTpCanvasElement: {
        prototype: HTMLTpCanvasElement;
        new (): HTMLTpCanvasElement;
    };
    interface HTMLTpCanvasControlsElement extends Components.TpCanvasControls, HTMLStencilElement {
    }
    var HTMLTpCanvasControlsElement: {
        prototype: HTMLTpCanvasControlsElement;
        new (): HTMLTpCanvasControlsElement;
    };
    interface HTMLTpInputZoneElement extends Components.TpInputZone, HTMLStencilElement {
    }
    var HTMLTpInputZoneElement: {
        prototype: HTMLTpInputZoneElement;
        new (): HTMLTpInputZoneElement;
    };
    interface HTMLElementTagNameMap {
        "tp-canvas": HTMLTpCanvasElement;
        "tp-canvas-controls": HTMLTpCanvasControlsElement;
        "tp-input-zone": HTMLTpInputZoneElement;
    }
}
declare namespace LocalJSX {
    interface TpCanvas {
        "height"?: number;
        "width"?: number;
    }
    interface TpCanvasControls {
    }
    interface TpInputZone {
        "round"?: number;
    }
    interface IntrinsicElements {
        "tp-canvas": TpCanvas;
        "tp-canvas-controls": TpCanvasControls;
        "tp-input-zone": TpInputZone;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "tp-canvas": LocalJSX.TpCanvas & JSXBase.HTMLAttributes<HTMLTpCanvasElement>;
            "tp-canvas-controls": LocalJSX.TpCanvasControls & JSXBase.HTMLAttributes<HTMLTpCanvasControlsElement>;
            "tp-input-zone": LocalJSX.TpInputZone & JSXBase.HTMLAttributes<HTMLTpInputZoneElement>;
        }
    }
}
