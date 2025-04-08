import {
  setDoc,
  doc,
  getDoc,
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore/lite';
import {
  get,
  set,
  remove,
  ref as rtdbRef,
  onValue,
  getDatabase,
  onDisconnect,
  type Database,
  connectDatabaseEmulator,
} from 'firebase/database';
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  getStorage,
  type FirebaseStorage,
  connectStorageEmulator,
} from 'firebase/storage';
import { type FirebaseOptions, initializeApp } from 'firebase/app';
import { BYFOConfig, config as defaultGameConfig } from './config';
import { decodePath, encodePath, isValidUsername } from './general';

export class BYFOFirebaseAdapter {
  /**
   * Backs up the last submission time to prevent double ups on timeout submissions
   */
  lastSubmission: number | null = null;

  /**
   * Holds the connection objects for the firebase services
   */
  connection: {
    db: Firestore | null;
    rtdb: Database | null;
    storage: FirebaseStorage | null;
  } = {
    db: null,
    rtdb: null,
    storage: null,
  };

  /**
   * Determines if the firebase times should be determined by
   */
  timeOffset?: number;
  get now(): number {
    return performance.timeOrigin + performance.now() - (this.timeOffset ?? 0);
  }
  async syncTimer() {
    const internetTime = await fetch('https://timeserver-fi5ferccpa-uc.a.run.app')
      .then(r => r.json())
      .then(b => b.time);
    this.timeOffset = performance.timeOrigin + performance.now() - internetTime;
  }

  gameConfig: BYFOConfig;

  /**
   * Passes the firebase settings to the config object
   * Required for all other functions in byfo-utils/firebase
   *
   * @param firebaseConfig - The firebase config JSON object that the firebase console gives you
   */
  constructor(firebaseConfig: FirebaseOptions, gameConfig?: Partial<BYFOConfig>, forceEmulators?: boolean) {
    const app = initializeApp(firebaseConfig);
    this.connection.db = getFirestore(app);
    this.connection.rtdb = getDatabase(app);
    this.connection.storage = getStorage(app);
    if (forceEmulators || location.hostname === 'localhost') {
      console.log('Connecting to firebase emulators');
      connectDatabaseEmulator(this.connection.rtdb, '127.0.0.1', 9000);
      connectFirestoreEmulator(this.connection.db, '127.0.0.1', 8080);
      connectStorageEmulator(this.connection.storage, '127.0.0.1', 9199);
    }
    this.gameConfig = Object.assign({}, defaultGameConfig, gameConfig);
    this.syncTimer();
  }

  //#region firestore
  /**
   * Adds a game to the fire store
   * @param gameid - The game being stored
   * @param stacks - The full stack data object with all players and rounds
   * @returns true if successful, otherwise void
   */
  async storeGame(gameid: number, stacks: GameStacks, metadata: Metadata): Promise<boolean> {
    if (!this.connection.db) throw new Error("Firebase database did not connect, can't store game");
    const docRef = doc(this.connection.db, `games/${gameid}`);
    await setDoc(docRef, stacks);

    const metadataRef = doc(this.connection.db, `metadata/${gameid}`);
    await setDoc(metadataRef, metadata);
    return true;
  }

  /**
   * Fetches the stacks from a completed game
   * @param gameid
   * @returns
   */
  async getGameData(gameid: number): Promise<GameStacks> {
    if (!this.connection.db) throw new Error("Firebase database did not connect, can't fetch stacks");
    const docRef = doc(this.connection.db, `games/${gameid}`);
    const snapshot = await getDoc(docRef);
    const gameData = snapshot.data() as GameStacks;
    return gameData;
  }

  /**
   * Fetches the metadata from a completed game
   * @param gameid
   * @returns
   */
  async getGameMetadata(gameid: number): Promise<Metadata> {
    if (!this.connection.db) throw new Error("Firebase database did not connect, can't fetch game info");
    const docRef = doc(this.connection.db, `metadata/${gameid}`);
    const snapshot = await getDoc(docRef);
    const metadata = (snapshot.data() as Metadata | undefined) ?? { roundLength: 180000, date: 'unknown' };
    return metadata;
  }
  //#endregion

  //#region Realtime Database

  /**
   * Shorthand function for getting a Real Time Database Reference
   *
   * @param path - The location in your real time database that you're referencing
   * @returns A Real Time Database Reference for the given path
   *
   * @internal
   */
  ref(path: string) {
    if (this.connection.rtdb === null) {
      throw new Error('Firebase App Connection not configured');
    }
    const fixedPath = encodePath(path);
    return rtdbRef(this.connection.rtdb, fixedPath);
  }

  /**
   * Shorthand function for getting the value at a given reference path in the real time database
   *
   * @param path - The location in your real time database that you're fetching
   * @returns The value stored at that location, or null, if nothing is there
   */
  async getRef(path: string) {
    return await get(this.ref(path)).then(result => result.val());
  }

  /**
   * Shorthand function for getting the value at a given reference path in the real time database
   *
   * @param path - The location in your real time database that you're fetching
   * @returns The value stored at that location, or null, if nothing is there
   */
  async setRef(path: string, value: unknown) {
    return await set(this.ref(path), value);
  }

  async removeRef(path: string) {
    return await remove(this.ref(path));
  }

  /**
   * Simple random number generation that handles repeats
   * Used to generate the players order as they join the game
   *
   * @param taken - Values that are already "used"/will not be generated
   * @returns A value from 0-999 that is unique to the input set
   *
   * @internal
   */
  generatePriority(taken?: Set<number>): number {
    let priority = Math.floor(Math.random() * Math.random() * 100000) % 997;
    while (taken && taken.has(priority)) {
      priority = Math.floor(Math.random() * Math.random() * 100000) % 997;
    }
    return priority;
  }

  /**
   * Generates the default data for if a player does not submit.
   *
   * @param type - The type of content being generated
   * @returns A string with either a plaintext prompt or an image url
   *
   * @internal
   */
  getDefaultContent(type: 'text' | 'image'): string {
    if (type === 'image') {
      //As it stands, a "false" image will prompt the content to point to a single existing "no image" image
      //If we had a dynamic image generation, it would go here
      return '';
    }

    //If we had an API call for generating or suggesting text, it would go here
    return 'Whoops, I forgot to submit something :(';
  }

  /**
   * interface function to put a player into a given lobby
   *
   * @param gameid - Game to join
   * @param username - User being added
   * @returns An object describing the result of the request
   *
   * @async
   * @external
   */
  async joinGame(gameid: number, username: string): Promise<ActionResponse> {
    //Grab the game status
    const gameStatus = await this.getRef(`game-statuses/${gameid}`);
    const result: ActionResponse = {
      action: 'error',
    };
    //If the game exists, read the data
    if (!gameStatus) {
      result.detail = 'Game does not exist';
      return result;
    }
    if (gameStatus.finished) {
      result.detail = 'Game has already finished';
      return result;
    }

    //Check the players list
    const players: PlayerList = await this.getWaitingPlayers(gameid);
    const playerNumbers = new Set<number>();

    // Check to make sure there isn't a rejoin or duplicate name
    for (const playerNumber in players) {
      const player = players[playerNumber];
      if (player.username === username) {
        if (player.status === 'missing') {
          this.turnInMissing(gameid, ~~playerNumber);
          return {
            action: 'join',
            dest: gameStatus.started ? 'game' : 'lobby',
          };
        }
        if (!gameStatus.started) {
          result.detail = 'Username already taken in game';
          return result;
        }
      }
      playerNumbers.add(parseInt(playerNumber));
    }

    if (gameStatus.started) {
      result.detail = 'Game has already started';
      return result;
    }

    if (playerNumbers.size > this.gameConfig.maxPlayers) {
      result.detail = 'Too many players in game';
      return result;
    }

    //If there are no issues, push in the new player
    this.setRef(`players/${gameid}/${this.generatePriority(playerNumbers)}`, { username, status: 'ready' });

    return { action: 'lobby', dest: 'lobby' };
  }

  /**
   * Create a new lobby in the realtime database and add the host/creator
   * @param gameid - The gameid you want to create
   * @param username - The host
   * @returns void
   */
  async createLobby(gameid: number, username: string): Promise<void> {
    const statusSet = this.setRef(`game-statuses/${gameid}`, {
      started: false,
      finished: false,
    });
    const playerSet = this.setRef(`players/${gameid}/${this.generatePriority()}`, {
      username,
      status: 'ready',
    });
    const hostSet = this.setRef(`players/${gameid}/__host`, { username });
    await Promise.all([statusSet, playerSet, hostSet]);
    return;
  }

  /**
   * Gets the game status of a specified game
   * @param gameid - The game to get the status of
   * @returns Game status (if any)
   */
  async getGameStatus(gameid: number): Promise<GameStatus | null> {
    return this.getRef(`game-statuses/${gameid}`);
  }

  /**
   * Gets the list of all game statuses
   * @returns An object pairing gameids to statuses
   */
  async listGameStatus(): Promise<{ [id: number]: GameStatus }> {
    const statuses = await this.getRef('game-statuses');
    return statuses ?? {};
  }

  async createGame(user: string): Promise<string | false> {
    try {
      if (!isValidUsername(user)) {
        return false;
      }
    } catch {
      return false;
    }

    const gameStatuses = await this.listGameStatus();
    // Check which gameIds were/are in use via firestore, then generate one that's not there
    const usedIds = new Set<number>(Object.keys(gameStatuses).map(id => parseInt(id)));

    const devGame = user.match(/Jacob-dev-test-(draw|write)/i);
    if (devGame) {
      return this.createDevGame(devGame, Math.max(...usedIds) + 1);
    }
    // Try a random old game id
    let newId = Math.floor(Math.random() * 999999 + 1);

    //On conflict, this threshold is used to determine if we should keep generating random numbers
    //If the chance that a random number will conflict is too high, try something like incrementing instead
    const randomThreshold = 0.5;
    while (usedIds.has(newId)) {
      if (usedIds.size < randomThreshold * 999999) {
        newId = Math.floor(Math.random() * 999999 + 1);
      } else {
        newId++;
      }
    }

    //Send the request for this game to firestore
    await this.createLobby(newId, user);

    //Pass this id back so we can route the player to the lobby
    return `${newId}`;
  }

  /**
   * Creates a special game for testing that's meant to never end and jump right into a certain state
   * @param devMatch - a short array with the regex match data for a dev game username
   * @param gameid - The game being created
   * @returns The game id, if successful
   */
  async createDevGame([username, key]: string[], gameid: number): Promise<string | false> {
    if (!/^draw|write$/i.test(key)) return false;
    const isDraw = /^draw$/i.test(key);

    try {
      const promises: Promise<unknown>[] = [];

      promises.push(
        this.setRef(`game-statuses/${gameid}`, {
          started: true,
          finished: false,
        }),
      );

      promises.push(
        this.setRef(`players/${gameid}/${this.generatePriority()}`, { username, status: 'missing' }),
      );

      const round0 = {
        roundnumber: isDraw ? 1 : 2,
        endTime: -1,
      };
      promises.push(this.setRef(`game/${gameid}/round`, round0));

      promises.push(
        this.setRef(`game/${gameid}/staticRoundInfo`, {
          lastRound: 1000,
          roundLength: -1,
        }),
      );

      promises.push(this.setRef(`game/${gameid}/players/${username}`, { to: username, from: username }));

      promises.push(this.setRef(`game/${gameid}/finished/${username}`, -1));

      await Promise.all(promises);
    } catch (e) {
      console.error(e);
      return false;
    }

    return `${gameid}`;
  }

  /**
   * Sets up the gameplay section in the realtime database, then marks the game as started
   * @param gameid - the game being started
   * @param roundLength - The time for every round of the game, in milliseconds
   * @returns void
   */
  async beginGame(gameid: number, roundLength: number): Promise<void> {
    if (roundLength === Number.POSITIVE_INFINITY) roundLength = -1;
    //Set up the round variable at 0
    const round0 = {
      roundnumber: 0,
      endTime: this.now + roundLength,
    };
    if (roundLength === -1) round0.endTime = -1;
    this.setRef(`game/${gameid}/round`, round0);

    //Get the players
    const playerList: Player[] = Object.values(await this.getWaitingPlayers(gameid));
    this.setRef(`game/${gameid}/staticRoundInfo`, {
      lastRound: playerList.length - 1,
      roundLength,
    });

    //List of outstanding promises, that way we can let them all run in parallel and only block for them at the end
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < playerList.length; i++) {
      const name = playerList[i].username;

      //Set up the player-to-from list
      const fromIdx = i - 1 < 0 ? playerList.length - 1 : i - 1;
      const toIdx = (i + 1) % playerList.length;
      const from = playerList[fromIdx].username;
      const to = playerList[toIdx].username;
      promises.push(this.setRef(`game/${gameid}/players/${name}`, { to, from }));

      //Set up the "which round have they finished" status
      promises.push(this.setRef(`game/${gameid}/finished/${name}`, -1));
    }

    await Promise.all(promises);

    //Set the game status started to true
    await this.setRef(`game-statuses/${gameid}/started`, true);

    return;
  }

  /**
   * Sends in the content for a round, and uploads the image to storage, if necessary
   * @param gameid - The game being submitted to
   * @param name - The player submitting something
   * @param round - The round number within the game
   * @param rawContent - The content to be written out
   * @param staticRoundInfo - Round metadata, like which round is last and how long rounds are
   * @returns void
   */
  async submitRound(
    gameid: number,
    name: string,
    round: number,
    rawContent: Blob | string | undefined,
    staticRoundInfo: StaticRoundInfo,
    forced: boolean = false,
  ): Promise<true | void> {
    if (Date.now() - (this.lastSubmission ?? 0) < this.gameConfig.minRoundLength * 1000) {
      // If we got 2 submissions less than the minimum round length apart, they're surely in error
      return;
    }
    this.lastSubmission = Date.now();
    const contentType = round % 2 === 0 ? 'text' : 'image';
    if (
      (contentType === 'text' && rawContent instanceof Blob) ||
      (contentType === 'image' && typeof rawContent === 'string')
    ) {
      if (!forced) {
        throw new Error();
      }
      rawContent = this.getDefaultContent(contentType);
    }
    if (
      contentType === 'text' &&
      typeof rawContent === 'string' &&
      rawContent.length > this.gameConfig.textboxMaxCharacters
    ) {
      if (!forced) {
        throw new Error();
      }
      rawContent = rawContent.slice(0, this.gameConfig.textboxMaxCharacters);
    }
    const content: string =
      rawContent instanceof Blob
        ? await this.uploadImage(gameid, name, round, rawContent)
        : rawContent || this.getDefaultContent(contentType);
    const savedContent: RoundContent = { contentType, content };

    await this.setRef(`game/${gameid}/stacks/${name}/${round}`, savedContent);

    await this.setRef(`game/${gameid}/finished/${name}`, round);

    const finished = await this.getRef(`game/${gameid}/finished`);

    //Check every player. If someone's not done, leave now
    for (const player in finished) {
      if (finished[player] < round) {
        return;
      }
    }

    //If everyone's done:
    if (round == staticRoundInfo.lastRound) {
      //If this was the last round, finalize the game
      await this.finalizeGame(gameid);
      return;
    }
    //Set the round number and end time forward
    const newRoundData: RoundData = {
      roundnumber: round + 1,
      endTime: this.now + staticRoundInfo.roundLength,
    };
    if (staticRoundInfo.roundLength === -1) newRoundData.endTime = -1;
    await this.setRef(`game/${gameid}/round/`, newRoundData);

    return true;
  }

  /**
   * Fetches the finished rounds for a each player in a given game
   * @param gameid
   * @param name
   * @returns A mapping of each round each player has completed
   */
  async fetchFinishedRounds(gameid: number): Promise<Record<string, number>> {
    return await this.getRef(`game/${gameid}/finished`);
  }
  /**
   * Fetches the finished round for a given player in a given game
   * @param gameid
   * @param name
   * @returns The last round number that the player has submitted a response for
   */
  async fetchFinishedRound(gameid: number, name: string): Promise<number> {
    if (!name) {
      throw new Error("Can't fetch round, name is not defined");
    }
    const round = await this.getRef(`game/${gameid}/finished/${name}`);
    return ~~round;
  }

  /**
   * Fetch the current round state of the game
   * @param gameid
   * @returns The current round data
   */
  async getRoundData(gameid: number): Promise<RoundData> {
    return await this.getRef(`game/${gameid}/round`);
  }

  /**
   * Gets a card from active gameplay data
   * @param gameid - the game being played
   * @param target - the person being recieved from
   * @param round - the round number within the game
   * @returns Card data, or null if it doesn't exist
   */
  async fetchCard(gameid: number, target: string, round: number) {
    return this.getRef(`game/${gameid}/stacks/${encodePath(target)}/${round}`);
  }

  async getHost(gameid: number): Promise<string> {
    const encoded = await this.getRef(`players/${gameid}/__host/username`);
    return decodePath(encoded);
  }

  /**
   * Check if a prospective player was missing from the game, and mark them no longer missing
   * @param gameid - the game being rejoined
   * @param number - the player number
   * @returns A boolean of whether or not they successfully rejoined
   */
  async turnInMissing(gameid: number, number: number) {
    if (gameid > 999999) {
      //If this is a debug game, just assume it was a rejoin
      return true;
    }

    const status = await this.getRef(`players/${gameid}/${number}/status`);
    if (status === 'missing') {
      this.setRef(`players/${gameid}/${number}/status`, 'ready');
      return true;
    }
    return false;
  }

  /**
   * Attaches a listener that will mark a player missing if they disconnect
   * @param gameid - the game being watched
   * @param playerNumber - the player number being watched
   * @returns An unsubscribe function
   */
  attachMissingListener(gameid: number, playerNumber: number) {
    const myStatusRef = this.ref(`players/${gameid}/${playerNumber}/status`);
    const listener = onDisconnect(myStatusRef);
    listener.set('missing'); // Normal behavior
    return listener; //Give the listener back so it can be canceled
  }

  /**
   * Generic function to add a listener for a given realtime database path
   * @param path - The location to be watched
   * @param callback - The function to be called on watched update
   * @returns Unsubscribe function for the listener
   */
  watchPath<T>(path: string, callback: (snapshot: T) => void) {
    const pathRef = this.ref(path);
    return onValue(pathRef, v => callback(v.val()));
  }

  /**
   * Listens for a game to be started
   * @extends {@link watchPath}
   */
  onGameStatusChange(gameid: number, callback: (snapshot: GameStatus) => unknown) {
    return this.watchPath(`game-statuses/${gameid}`, callback);
  }

  /**
   * Listens for changes to the player list in a lobby
   * @extends {@link watchPath}
   */
  onPlayerListChange(gameid: number, callback: (snapshot: PlayerList) => unknown) {
    return this.watchPath(`players/${gameid}`, callback);
  }

  /**
   * Listens for new rounds
   * @extends {@link watchPath}
   */
  onRoundChange(gameid: number, callback: (snapshot: RoundData) => unknown) {
    return this.watchPath(`game/${gameid}/round`, callback);
  }

  /**
   * Listens for changes to who's finished which rounds. Maps usernames to which round they have finished.
   * @extends {@link watchPath}
   */
  onPlayerStatusChange(gameid: number, callback: (snapshot: Record<string, number>) => unknown) {
    return this.watchPath(`game/${gameid}/finished`, callback);
  }

  /**
   * Gets the players currently in the lobby
   * @param gameid - Game to be fetched
   * @returns A list of player objects
   */
  async getWaitingPlayers(gameid: number): Promise<PlayerList> {
    const allEntries = await this.getRef(`players/${gameid}`);
    delete allEntries['__host'];
    return allEntries;
  }

  /**
   * Gets who a player is sending to and recieving from
   * @param gameid - The game being referenced
   * @param name - The player being referenced
   * @returns The to and from data for the searched player
   */
  async getToAndFrom(gameid: number, name: string): Promise<{ to: string; from: string }> {
    return this.getRef(`game/${gameid}/players/${name}`);
  }

  /**
   * Gets the randomly assigned number for a given player
   * @param gameid - The game being referenced
   * @param name - The player being referenced
   * @returns The player id within that game
   */
  async getPlayerNumber(gameid: number, name: string) {
    const players: PlayerList = await this.getWaitingPlayers(gameid);
    for (const num in players) {
      if (players[num].username === name) {
        return num;
      }
    }
    return undefined;
  }

  /**
   * Gets the static round info for a game
   * @param gameid - The game
   * @returns The static round info
   */
  async getStaticRoundInfo(gameid: number): Promise<StaticRoundInfo> {
    return this.getRef(`game/${gameid}/staticRoundInfo`);
  }

  /**
   * Cleans up real time gameplay data and sends it to the firestore
   * @param gameid - The game being adjusted
   * @returns void
   */
  async finalizeGame(gameid: number) {
    const stackData = await this.getRef(`game/${gameid}/stacks`);
    const playerOrder: GamePlayers = await this.getRef(`game/${gameid}/players`);
    const roundLength: number = await this.getRef(`game/${gameid}/staticRoundInfo/roundLength`);

    const metadata = {
      date: new Date().toString(),
      roundLength,
    };

    const finalStackData: GameStacks = {};
    for (const player in stackData) {
      let source = player;
      finalStackData[player] = {};
      for (let i = 0; i < stackData[source].length; i++) {
        finalStackData[player][i] = { ...stackData[source][i], from: decodePath(source) };
        source = encodePath(playerOrder[source].to);
      }
    }

    this.setRef(`game-statuses/${gameid}/finished`, true);

    this.storeGame(gameid, finalStackData, metadata).then(
      _success => {
        //Delete the game from the realtime database
        this.removeRef(`game/${gameid}`);
      },
      _failure => {
        console.log('failed to store game');
      },
    );
    return;
  }

  /**
   * Adds time to an active gameplay round
   * @param gameid - The game to add time to
   * @param msToAdd - The amount of time to add in ms
   * @returns void
   */
  async sendAddTime(gameid: number, msToAdd: number) {
    if (msToAdd < 1000) return;

    const oldEndTime: number = await this.getRef(`game/${gameid}/round/endTime`);

    if (!oldEndTime) throw new Error('Cannot find game round to add time');

    const baseTime = Math.max(oldEndTime, Date.now());
    const endTime = baseTime + msToAdd;

    return this.setRef(`game/${gameid}/round/endTime`, endTime);
  }
  //#endregion

  //#region Storage
  /**
   * Adds an image to firebase storage
   * @param gameid - The game the image is from
   * @param player - The author of the image
   * @param round - The round the image is from
   * @param imgData - The raw image blob
   * @returns The url to the uploaded image
   */
  async uploadImage(gameid: number, player: string, round: number, imgData: Blob | false) {
    if (!this.connection.storage) throw new Error("Firebase storage did not connect, can't upload image");
    if (!imgData || imgData.size === 0) {
      return '/default.png';
    }
    const imgref = storageRef(this.connection.storage, `/games/${gameid}/${round}/${player}.png`);
    await uploadBytes(imgref, imgData, { contentType: 'image/png', cacheControl: 'public,max-age=86400' });
    return getDownloadURL(imgref);
  }
  //#endregion

  //#region validation
  /**
   * Determines if a given round length is valid
   * @param input Round length in milliseconds
   * @param config The game config object
   * @returns true if the time is usable as a round length
   */
  isValidTime(input: number): boolean {
    const { minRoundLength, maxRoundLength } = this.gameConfig;
    if (input === Number.POSITIVE_INFINITY) {
      return true;
    }
    if (input > maxRoundLength * 60000 || input < minRoundLength * 1000) {
      return false;
    }
    return true;
  }

  isValidPlayerList(input: PlayerList): boolean {
    const { minPlayers, maxPlayers } = this.gameConfig;
    const playerCount = Object.keys(input).filter(key => key !== '__host').length;
    return playerCount >= minPlayers && playerCount <= maxPlayers;
  }
}

export interface Player {
  username: string;
  status?: string;
  lastRound?: number;
}

export interface PlayerList {
  __host: { username: string };
  [key: number]: Player;
}

export interface RoundContent {
  contentType: 'text' | 'image';
  content?: string;
}

export interface GameStatus {
  started: boolean;
  finished: boolean;
}

export interface Game {
  players: GamePlayers;
  round: RoundData;
  staticRoundInfo: StaticRoundInfo;
  stacks: GameStacks;
}

export interface GamePlayers {
  [name: string]: {
    to: string;
    from: string;
  };
}

export interface RoundData {
  roundnumber: number;
  endTime: number; // unix timestamp
}

export interface StaticRoundInfo {
  lastRound: number;
  roundLength: number; //in ms
}

export interface GameStacks {
  [author: string]: {
    [roundnumber: string]: RoundContent;
  };
}

export interface FirebaseConnections {
  db: Firestore | null;
  rtdb: Database | null;
  storage: FirebaseStorage | null;
}

export interface RefOptions {
  noEncode?: boolean;
}

export interface Metadata {
  date: string;
  roundLength: number;
}

export declare type ActionResponse = {
  action?: string; // The action being done
  detail?: string; // The return message, if applicable
  dest?: 'lobby' | 'game'; // The page to redirect to
};
