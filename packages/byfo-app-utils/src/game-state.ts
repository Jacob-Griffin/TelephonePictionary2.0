import { config as defaultConfig, BYFOConfig } from './config';
import { BYFOFirebaseAdapter, RoundContent, RoundData, StaticRoundInfo } from './firebase';
import { encodePath } from './general';
import { useAccessor } from './accessors';

export class BYFOGameState {
  #firebase: BYFOFirebaseAdapter;
  constructor(firebase: BYFOFirebaseAdapter, gameid: number | string, self: string) {
    this.#config = Object.assign({}, defaultConfig, firebase?.gameConfig ?? {});
    // We're going to assume the gameid and username were validated somewhere else. We're past the point where it would have had effects
    this.#gameid = ~~gameid;
    this.#self = self;
    this.#firebase = firebase;
  }

  async initialize() {
    const prefetch = await this.#firebase.getRoundData(this.#gameid);
    if (prefetch) {
      if (prefetch.endTime > 0) {
        this.endtime = prefetch.endTime;
        this.timeTick();
      }
      return await this.initializeGameplay();
    }
    const status = await this.#firebase.getGameStatus(this.#gameid);
    if (!status) {
      throw new GameStateError('home');
    } else if (status.finished) {
      throw new GameStateError('review', this.#gameid.toString());
    } else if (status.started) {
      return await this.initializeGameplay();
    } else {
      throw new GameStateError('lobby', this.#gameid.toString());
    }
  }

  #gameplayHandles: { clearAll: () => void } & Record<string, number | (() => void)> = {
    clearAll: () => {
      Object.entries(this.#gameplayHandles).forEach(([name, handle]) => {
        if (name === 'clearAll') {
          return;
        }
        if (typeof handle === 'function') {
          handle();
        } else {
          clearInterval(handle);
        }
      });
    },
  };

  timeTick = () => {
    if (!this.endtime || this.endtime < 0) {
      return;
    }
    const t = this.endtime - this.#firebase.now;
    if (t % 1000 > this.currentTimeRemaining! % 1000) {
      if (t > 0) {
        const min = Math.floor(t / 60000).toString();
        const sec = Math.floor((t / 1000) % 60)
          .toString()
          .padStart(2, '0');
        this.timeRemainingString = `${min}:${sec}`;
      } else {
        this.timeRemainingString = "Time's up!";
      }
    }
    this.currentTimeRemaining = t;
  };

  async initializeGameplay() {
    let retries = 3;
    let initialRoundData = await this.#firebase.getRoundData(this.gameid);
    while (!initialRoundData && retries > 0) {
      retries -= 1;
      initialRoundData = await this.#firebase.getRoundData(this.gameid);
    }
    if (!initialRoundData) {
      throw new GameStateError('home');
    }

    const host = await this.#firebase.getHost(this.gameid);
    this.#isHost = host === this.#self;
    const { from, to } = await this.#firebase.getToAndFrom(this.gameid, this.self);
    this.#from = from;
    this.#to = to;

    this.players = await this.#firebase.fetchFinishedRounds(this.gameid);
    this.#gameplayHandles.roundChange = this.#firebase.onRoundChange(
      this.gameid,
      this.#handleRoundChange.bind(this),
    );
    if (initialRoundData.endTime > 0) {
      this.#gameplayHandles.timeChange = this.on(
        'endtime',
        v => (this.currentTimeRemaining = v! - this.#firebase.now),
      );
      this.#gameplayHandles.time = setInterval(this.timeTick, 250);
      this.timeTick();
    }
    this.#gameplayHandles.whoFinishedChange = this.#firebase.onPlayerStatusChange(
      this.gameid,
      this.#handleStatusChange.bind(this),
    );

    this.#staticRoundInfo = await this.#firebase.getStaticRoundInfo(this.gameid);
    this.#initialized.resolve();
  }

  async #handleRoundChange(data: RoundData) {
    if (!data) {
      this.#handleGameOver();
      return;
    }
    this.endtime = data.endTime;
    this.round = data.roundnumber;
    if (data.endTime > 0) {
      this.timeTick();
    }
    if ((this.players as Record<string, number>)?.[this.#self] >= this.round) {
      this.state = 'waiting';
    } else {
      this.state = this.round % 2 === 0 ? 'writing' : 'drawing';
    }
    if (this.round > 0 && this.state !== 'waiting') {
      this.recievedCard = (await this.#firebase.fetchCard(
        this.gameid,
        this.from!,
        this.round - 1,
      )) as RoundContent;
    }
  }

  async #handleStatusChange(data: Record<string, number>) {
    this.players = data;
    if (!data) {
      return;
    }
    if (data[encodePath(this.self)] >= this.round!) {
      this.state = 'waiting';
    }
    this.playersReady = Object.fromEntries(
      Object.entries(data).map(([player, round]) => [player, round >= this.round!]),
    );
  }

  #handleGameOver() {
    this.#gameplayHandles.clearAll();
    this.clearBackups();
    this.state = 'finished';
  }

  get backupKey() {
    return `gameplay#${this.gameid}@${this.round}`;
  }

  getBackup = () => {
    return localStorage.getItem(this.backupKey);
  };

  setBackup = (data?: string) => {
    if (!data) {
      localStorage.removeItem(this.backupKey);
      return;
    }
    localStorage.setItem(this.backupKey, data);
  };

  clearBackups() {
    for (let i = 0; i <= (this.staticRoundInfo?.lastRound ?? 0); i++) {
      localStorage.removeItem(`gameplay#${this.gameid}@${i}`);
    }
  }

  public async submitRound(data?: string | Blob) {
    if (this.submitting) {
      return;
    }
    if (!['writing', 'drawing'].includes(this.state ?? '')) {
      return;
    }
    this.submitting = true;
    const forced = this.currentTimeRemaining! < 0;
    let error;
    try {
      await this.#firebase.submitRound(
        this.gameid,
        this.self,
        this.round!,
        data,
        this.#staticRoundInfo!,
        forced,
      );
    } catch (e) {
      console.error(e);
      error = e;
    } finally {
      this.submitting = false;
    }
    if (error) {
      return { error };
    }
  }
  //#region readonly
  #gameid: number;
  get gameid() {
    return this.#gameid;
  }

  #self: string;
  get self() {
    return this.#self;
  }

  #config: BYFOConfig;
  get config() {
    return this.#config;
  }

  #from?: string;
  get from() {
    return this.#from;
  }

  #to?: string;
  get to() {
    return this.#to;
  }

  #isHost?: boolean;
  get isHost() {
    return this.#isHost;
  }

  #staticRoundInfo?: StaticRoundInfo;
  get staticRoundInfo() {
    return this.#staticRoundInfo;
  }

  #error?: Error;
  get error() {
    return this.#error;
  }

  #initialized: PromiseWithResolvers<void> = Promise.withResolvers();
  get initialized(): Promise<void> {
    return this.#initialized.promise;
  }
  //#endregion

  //#region Accessors
  state?: 'drawing' | 'writing' | 'waiting' | 'finished';
  round?: number;
  endtime?: number;
  currentTimeRemaining?: number;
  timeRemainingString?: string;
  players?: Record<string, number>;
  playersReady?: Record<string, boolean>;
  recievedCard?: RoundContent;
  submitting: boolean = false;

  accessorList = [
    'round',
    'currentTimeRemaining',
    'endtime',
    'players',
    'recievedCard',
    'state',
    'submitting',
  ] as const;
  on = useAccessor<BYFOGameState>(this);
  //#endregion
}

type Destination = 'home' | 'lobby' | 'game' | 'review';
export class GameStateError extends Error {
  type = 'StateError';
  destination: Destination;
  destinationArg?: string;
  constructor(destination: Destination, destinationArg?: string) {
    super(`GameState error: global state is ${destination}`);
    this.destination = destination;
    this.destinationArg = destinationArg;
  }
}
