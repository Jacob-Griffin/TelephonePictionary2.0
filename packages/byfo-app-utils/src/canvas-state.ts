import { control, shift, useKeystrokes } from './general';
import { useAccessor } from './accessors';

const numsToPathString = (path: number[][]) => {
  if (!path || !path.length) {
    return '';
  }
  const strings = path.map(([x, y]) => `${x} ${y}`);
  return 'M ' + strings.join(' L ');
};

type PathEntry = LineEntry | ClearEntry;

type LineEntry = {
  path: [number, number][];
  color: string;
  size: number;
};

type ClearEntry = {
  clear: string;
};

type PenSize = 'small' | 'medium' | 'large' | 'xlarge';
type PenSizeMap = Record<'draw' | 'erase', Record<PenSize, number>>;

const reader = new FileReader();

export class BYFOCanvasState {
  #context: CanvasRenderingContext2D;
  #box: DOMRect;
  #src: HTMLCanvasElement;
  #height: number;
  #width: number;

  constructor(
    src: HTMLCanvasElement,
    { internalWidth, internalHeight }: { internalWidth: number; internalHeight: number },
    data?: string,
  ) {
    const ctx = src.getContext('2d');
    if (!ctx) {
      throw new Error('Could not retrieve canvas context');
    }
    this.#context = ctx;
    this.#box = src.getBoundingClientRect();
    this.#src = src;
    this.#height = internalHeight;
    this.#width = internalWidth;

    this.setupContext();
    this.setupInputs();

    if (data) {
      this.paths = JSON.parse(data);
      this.redraw();
    }
  }

  setupContext() {
    this.#context.strokeStyle = 'rgb(0,0,0)';
    this.#context.fillStyle = 'rgb(255,255,255)';
    this.#context.lineWidth = this.lineWidths.small;
    this.#context.lineCap = 'round';
    this.#context.lineJoin = 'round';

    this.#context.fillRect(0, 0, this.#width, this.#height); //Background

    if (this.paths?.length > 0) {
      // If there was a restore backup call but the ctx wasn't loaded yet, catch up
      this.redraw();
    } else {
      // If this is a brand new canvas, make sure there's a clear event so that invert will work
      this.paths.push({ clear: '#FFF' });
    }
  }

  setupInputs() {
    this.#src.addEventListener('pointerdown', this.#startDraw);
    const events = Object.entries(this.#documentInputEventMap) as [
      keyof DocumentEventMap,
      (e: Event) => void,
    ][];
    for (const [event, handler] of events) {
      document.addEventListener(event, handler);
    }
  }

  cleanupInputs() {
    this.#src.removeEventListener('pointerdown', this.#startDraw);
    const events = Object.entries(this.#documentInputEventMap) as [
      keyof DocumentEventMap,
      (e: Event) => void,
    ][];
    for (const [event, handler] of events) {
      document.removeEventListener(event, handler);
    }
  }

  //#region drawing
  #startDraw = (event: PointerEvent) => {
    //We only want to start a line if there already isn't a line
    if (this.currentPath.length === 0) {
      if (event.ctrlKey) {
        this.invertCurrent = true;
        this.setDrawMode(this.mode === 'draw' ? 'erase' : 'draw', true);
      }
      this.#box = this.#src.getBoundingClientRect();
      const point = this.transformScreenPoint(event);
      this.currentPath.push(point);
      this.lastDrawEnd = performance.now();
    }
  };

  #draw = (event: PointerEvent) => {
    //We only want to continue drawing if we've already started a line
    if (this.currentPath.length > 0) {
      if (performance.now() - this.lastDrawEnd < 5) {
        // There's a little bit of jitter with the mouse moves if they happen too quickly
        // Stop the event if it hasn't been a full rendered window frame
        return;
      }
      const point = this.transformScreenPoint(event);
      // Adjust the point just barely so it renders dots. This is fine unconditionally
      point[0] += 0.1;
      point[1] += 0.1;
      // This seems redundant to continually begin paths when paths don't really have to go away, but
      // This fixes a weird firefox bug with negligible performance impact, so might as well
      this.#context.beginPath();
      this.#context.moveTo(...this.currentPath.at(-1)!);
      this.currentPath.push(point);
      this.#context.lineTo(...point);
      this.#context.stroke();
      this.lastDrawEnd = performance.now();
    }
    return true;
  };

  #finishLine = (event?: PointerEvent) => {
    //Only add the path if there is one
    if (this.currentPath.length > 0) {
      if (!event) {
        const path = new Path2D(numsToPathString(this.currentPath));
        this.#context.stroke(path);
      } else {
        this.#draw(event);
      }
      //Push the current Path to the path list and final drawing
      this.paths.push({
        path: this.currentPath,
        size: this.#context.lineWidth,
        color: this.#context.strokeStyle as string,
      });

      this.currentPath = [];
      this.backup = JSON.stringify(this.paths);

      if (event) {
        this.redoStack = [];
        this.redraw();
      }
    }
    if (this.invertCurrent) {
      this.invertCurrent = false;
      this.setDrawMode(this.mode);
    }
  };

  #keyStrokes = {
    [control + shift + 'z']: () => this.redo(),
    [control + 'z']: () => this.undo(),
    [control + shift + 'delete']: () => this.clearCanvas(),
    [control + '1']: () => this.changeLine('small'),
    [control + '2']: () => this.changeLine('medium'),
    [control + '3']: () => this.changeLine('large'),
    [control + '4']: () => this.changeLine('xlarge'),
  };

  #documentInputEventMap: Partial<{ [E in keyof DocumentEventMap]: (e: DocumentEventMap[E]) => void }> = {
    pointermove: this.#draw,
    pointerup: this.#finishLine,
    pointercancel: this.#finishLine,
    keydown: useKeystrokes(this.#keyStrokes),
  };

  lineWidthSets: PenSizeMap = {
    draw: {
      small: 5,
      medium: 8,
      large: 12,
      xlarge: 18,
    },
    erase: {
      small: 8,
      medium: 11,
      large: 15,
      xlarge: 21,
    },
  };

  lineWidths = this.lineWidthSets.draw;

  //Canvas State
  currentPath: [number, number][] = [];
  paths: PathEntry[] = []; //List of paths drawn (support for undo/redo)
  redoStack: PathEntry[] = []; //Stack of paths that were undone (clears on new path drawn)
  currentWidth: PenSize = 'small'; //Current Pen Size
  lastDrawEnd: number = performance.now();
  invertCurrent: boolean = false;
  mode: keyof PenSizeMap = 'draw';

  backup?: string;

  accessorList = ['backup', 'currentWidth', 'mode'] as const;
  on = useAccessor<BYFOCanvasState>(this);

  transformScreenPoint(e: { clientX: number; clientY: number }): [number, number] {
    const relativeX = e.clientX - this.#box.left;
    const relativeY = e.clientY - this.#box.top;
    const x = relativeX * (this.#width / this.#box.width);
    const y = relativeY * (this.#height / this.#box.height);
    return [x, y];
  }

  public async getImage() {
    this.redraw();
    const data = this.#context.getImageData(0, 0, this.#width, this.#height);
    const canvas = new OffscreenCanvas(this.#width, this.#height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not retrieve canvas context when retrieving image');
    }
    ctx.putImageData(data, 0, 0);
    return await canvas.convertToBlob();
  }

  public async getDataUrl(): Promise<string> {
    const blob = await this.getImage();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
      const onread = () => {
        reader.removeEventListener('loadend', onread);
        resolve(reader.result as string);
      };
      reader.addEventListener('loadend', onread);
    });
  }

  //#region undo-redo
  redo = () => {
    if (this.redoStack.length > 0 && this.currentPath.length === 0) {
      const currentItem = this.redoStack.pop()!;
      if ('clear' in currentItem) {
        this.clearCanvas(true);
      } else {
        const backupWidth = this.#context.lineWidth;
        const backupColor = this.#context.strokeStyle;

        this.currentPath = currentItem.path;
        this.#context.lineWidth = currentItem.size;
        this.#context.strokeStyle = currentItem.color;
        this.#finishLine();

        this.#context.lineWidth = backupWidth;
        this.#context.strokeStyle = backupColor;
      }
      this.backup = JSON.stringify(this.paths);
    }
  };

  undo = () => {
    if (this.paths.length <= 1 || this.currentPath.length > 0) {
      // Length 1 is also invalid because we must ensure an initial clear event
      return;
    }
    this.redoStack.push(this.paths.pop()!);

    this.backup = JSON.stringify(this.paths);

    this.redraw();
  };

  /**
   * Clears the image and recrates it from path data, to ensure there are no canvas abnormalities
   */
  redraw = () => {
    const currentStroke = this.#context.strokeStyle;
    const backupFill = this.#context.fillStyle;

    this.#context.fillStyle = '#FFF';
    this.#context.fillRect(0, 0, this.#width, this.#height);

    for (let i = 0; i < this.paths.length; i++) {
      const path = this.paths[i];
      if ('clear' in path) {
        this.#context.fillStyle = path.clear;
        this.#context.fillRect(0, 0, this.#width, this.#height);
      } else {
        this.#context.lineWidth = path.size;
        this.#context.strokeStyle = path.color;
        this.#context.stroke(new Path2D(numsToPathString(path.path)));
      }
    }

    this.#context.fillStyle = backupFill;
    this.#context.lineWidth = this.lineWidths[this.currentWidth];
    this.#context.strokeStyle = currentStroke;
  };

  //#region handle inputs
  clearCanvas = (fromRedo?: boolean) => {
    this.#context.fillStyle = '#FFF';
    this.#context.fillRect(0, 0, this.#width, this.#height);
    this.paths.push({ clear: '#FFF' });
    this.backup = JSON.stringify(this.paths);
    if (!fromRedo) {
      this.redoStack = [];
    }
  };

  changeLine = (size: PenSize) => {
    //As long as the width we were sent is in the list of widths,
    if (Object.keys(this.lineWidths).includes(size)) {
      //Set the canvas width to the corresponding size
      this.currentWidth = size;
      this.#context.lineWidth = this.lineWidths[size];
    }
  };

  setDrawMode = (mode: keyof PenSizeMap, temporary?: boolean) => {
    if (!temporary) {
      this.mode = mode;
    }
    //Set the pen color for draw/erase
    this.#context.strokeStyle = mode === 'erase' ? '#FFF' : '#000';
    this.lineWidths = this.lineWidthSets[mode];
    this.#context.lineWidth = this.lineWidths[this.currentWidth];
  };

  invert = () => {
    this.paths.forEach(path => {
      if ('clear' in path) {
        path.clear = /f/i.test(path.clear) ? '#000' : '#FFF';
      } else {
        path.color = /f/i.test(path.color) ? '#000' : '#FFF';
      }
    });
    this.redraw();
    this.backup = JSON.stringify(this.paths);
  };
  //#endregion handle inputs
}
