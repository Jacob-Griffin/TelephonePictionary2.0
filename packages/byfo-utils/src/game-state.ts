import { config as defaultConfig, BYFOConfig } from './config';
import { BYFOFirebaseAdapter, RoundContent, RoundData, StaticRoundInfo } from './firebase';
import { isValidGameId, isValidUsername } from './general';
import { useAccessor } from './accessors';

export class BYFOGameState {
  #firebase: BYFOFirebaseAdapter;
  constructor(firebase?: BYFOFirebaseAdapter, gameid?: number | string, self?: string) {
    this.#config = Object.assign({}, defaultConfig, firebase?.gameConfig ?? {});
    if (!isValidGameId(gameid.toString())) {
      this.#error = new Error(`Game error: invalid gameid ${gameid}`);
      return;
    }
    try {
      const valid = isValidUsername(self, this.config.usernameMaxCharacters);
      if (!valid) {
        return;
      }
    } catch (e) {
      this.#error = e;
      return;
    }

    this.#gameid = ~~gameid;
    this.#self = self;
    this.#firebase = firebase;

    this.initialize().catch(e => {
      if (e.type === 'StateError') {
        throw e;
      }
    });
  }

  async initialize() {
    const status = await this.#firebase.getGameStatus(this.#gameid);
    if (!status) {
      throw new GameStateError('pre-game');
    } else if (status.started) {
      return await this.initializeGameplay();
    } else if (status.finished) {
      throw new GameStateError('post-game');
    } else {
      throw new GameStateError('lobby');
    }
  }

  #gameplayHandles: { clearAll: () => void } & Record<string, number | (() => void)> = {
    clearAll: () => {
      Object.values(this.#gameplayHandles).forEach(handle => {
        if (typeof handle === 'function') {
          handle();
        } else {
          clearInterval(handle);
        }
      });
    },
  };

  async initializeGameplay() {
    let retries = 3;
    let initialRoundData = await this.#firebase.getRoundData(this.gameid);
    while (!initialRoundData && retries > 0) {
      retries -= 1;
      initialRoundData = await this.#firebase.getRoundData(this.gameid);
    }
    if (!initialRoundData) {
      throw new GameStateError('pre-game');
    }
    const host = await this.#firebase.getHost(this.gameid);
    this.#isHost = host === this.#self;
    const { from, to } = await this.#firebase.getToAndFrom(this.gameid, this.self);
    this.#from = from;
    this.#to = to;
    this.players = await this.#firebase.fetchFinishedRounds(this.gameid);

    this.#gameplayHandles.timeChange = this.on('endtime', v => (this.currentTimeRemaining = v - this.#firebase.now));
    await this.#handleRoundChange(initialRoundData);
    this.#gameplayHandles.time = setInterval(() => (this.currentTimeRemaining = this.endtime - this.#firebase.now), 500);

    this.#gameplayHandles.roundChange = this.#firebase.onRoundChange(this.gameid, this.#handleRoundChange);
    this.#gameplayHandles.whoFinishedChange = this.#firebase.onPlayerStatusChange(this.gameid, this.#handleStatusChange);
  }

  async #handleRoundChange(data: RoundData) {
    if (!data) {
      this.#handleGameOver();
      return;
    }
    this.endtime = data.endTime;
    this.round = data.roundnumber;
    if ((this.players as Record<string, number>)?.[this.#self] >= this.round) {
      this.state = 'waiting';
    } else {
      this.state = this.round % 2 === 0 ? 'writing' : 'drawing';
    }
    if (this.round > 0 && this.state !== 'waiting') {
      this.recievedCard = await this.#firebase.fetchCard(this.gameid, this.from, this.round - 1);
    }
  }

  async #handleStatusChange(data: Record<string, number>) {
    this.players = data;
    if (data[this.self] >= this.round) {
      this.state = 'waiting';
    }
  }

  #handleGameOver() {
    this.#gameplayHandles.clearAll();
    this.state = 'finished';
  }

  public async submitRound(data: string | Blob) {
    if (this.submitting) {
      return;
    }
    this.submitting = true;
    const forced = this.currentTimeRemaining < 0;
    try {
      await this.#firebase.submitRound(this.gameid, this.self, this.round, data, this.#staticRoundInfo, forced);
    } catch (e) {
      console.error(e);
    } finally {
      this.submitting = false;
    }
  }
  //#region readonly
  #gameid?: number;
  get gameid() {
    return this.#gameid;
  }

  #self?: string;
  get self() {
    return this.#self;
  }

  #config: BYFOConfig;
  get config() {
    return this.#config;
  }

  #from: string;
  get from() {
    return this.#from;
  }

  #to: string;
  get to() {
    return this.#to;
  }

  #isHost: boolean;
  get isHost() {
    return this.#isHost;
  }

  #staticRoundInfo: StaticRoundInfo;
  get staticRoundInfo() {
    return this.#staticRoundInfo;
  }

  #error?: Error;
  get error() {
    return this.#error;
  }
  //#endregion

  //#region Accessors
  state?: 'drawing' | 'writing' | 'waiting' | 'finished';
  round?: number;
  endtime?: number;
  currentTimeRemaining?: number;
  players?: Record<string, number>;
  recievedCard?: RoundContent;
  submitting?: boolean;

  on = useAccessor<BYFOGameState>(['round', 'currentTimeRemaining', 'endtime', 'players', 'recievedCard', 'state', 'submitting'], this);
  //#endregion
}

type Destination = 'pre-game' | 'lobby' | 'game' | 'post-game';
class GameStateError extends Error {
  type = 'StateError';
  destination: Destination;
  constructor(destination: Destination) {
    super(`GameState error: global state is ${destination}`);
    this.destination = destination;
  }
}
