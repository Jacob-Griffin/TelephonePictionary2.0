import { expect, test, vi } from 'vitest';
import { BYFOFirebaseAdapter, StaticRoundInfo } from '../src/firebase';
import { firebaseConfig } from '../../../apps/lit-byfo/firebase.config';
const adapter = new BYFOFirebaseAdapter(firebaseConfig, {}, true);
const context = { game: -1, roundLength: 180000, host: 'example', staticRoundInfo: {} };
await test('firebase', async () => {
  expect(adapter.connection.db).toBeDefined();
  expect(adapter.connection.rtdb).toBeDefined();
  expect(adapter.connection.storage).toBeDefined();
  expect(adapter.now).toBeGreaterThan(1744093248463);

  const emulatorStatus = setTimeout(() => {
    throw new Error(
      'Firebase Emulators do not seem to be started. Run "start:firebase" before running the utils tests',
    );
  }, 4000);
  const initialStatuses = await adapter.listGameStatus();
  clearTimeout(emulatorStatus);

  expect(initialStatuses).toBeDefined();
  expect(initialStatuses).toBeTypeOf('object');
});

await test('create game', async () => {
  const initialStatusList = await adapter.listGameStatus();
  expect(await adapter.createGame('MyNameHas/\\Slashes')).toBe(false);
  expect(await adapter.listGameStatus()).toEqual(initialStatusList);

  const gameid = (await adapter.createGame(context.host)) as string;
  expect(gameid).toBeDefined();
  expect(~~gameid).toBeLessThan(1000000);

  expect(await adapter.getGameStatus(~~gameid)).toEqual({ started: false, finished: false });
  expect(await adapter.listGameStatus()).haveOwnProperty(gameid);

  expect(await adapter.getHost(~~gameid)).toBe(context.host);
  context.game = ~~gameid;
});

await test('join game', async () => {
  let resolve;
  const firstCalled = new Promise(r => (resolve = r));
  const listUpdated = vi.fn(() => {
    if (resolve) {
      resolve();
      resolve = undefined;
    }
  });

  adapter.onPlayerListChange(context.game, listUpdated);

  await firstCalled;
  // We expect the watcher functions to return a result on watch, but it needs time to resolve
  expect(listUpdated).toBeCalledTimes(1);

  const badUsernameResponse = await adapter.joinGame(context.game, 'invalid/\\name');
  expect(badUsernameResponse.action).toBe('error');
  expect(badUsernameResponse.detail).toMatch(/^Names cannot contain/);
  expect(badUsernameResponse.dest).toBeUndefined();

  const noGameResponse = await adapter.joinGame(1234567, 'validUsername');
  expect(noGameResponse.action).toBe('error');
  expect(noGameResponse.detail).toBe('Game does not exist');
  expect(noGameResponse.dest).toBeUndefined();

  const mainResponse = await adapter.joinGame(context.game, 'validPlayer2');
  expect(mainResponse.action).toBe('lobby');
  expect(mainResponse.dest).toBe('lobby');
  expect(mainResponse.detail).toBeUndefined();

  //Only valid joins should trigger list update
  expect(listUpdated).toBeCalledTimes(2);

  const duplicateResponse = await adapter.joinGame(context.game, 'validPlayer2');
  expect(duplicateResponse.action).toBe('error');
  expect(duplicateResponse.detail).toBe('Username already taken in game');

  const playernumber = await adapter.getPlayerNumber(context.game, 'validPlayer2');
  expect(playernumber).toBeDefined();

  expect(listUpdated).toBeCalledTimes(2);

  await adapter.setRef(`players/${context.game}/${playernumber}/status`, 'missing');

  const rejoinResponse = await adapter.joinGame(context.game, 'validPlayer2');
  expect(rejoinResponse.action).toBe('join');
  expect(rejoinResponse.dest).toBe('lobby');
  expect(rejoinResponse.detail).toBeUndefined();

  //Rejoins count as valid joins
  expect(listUpdated).toBeCalledTimes(3);
});

await test('start game', async () => {
  let resolve;
  let status;
  const firstCalled = new Promise(r => (resolve = r));
  const statusUpdated = vi.fn(v => {
    if (resolve) {
      resolve();
      resolve = undefined;
    }
    status = v;
  });
  adapter.onGameStatusChange(context.game, statusUpdated);
  await firstCalled;
  expect(statusUpdated).toBeCalledTimes(1);
  expect(status).toEqual({ started: false, finished: false });
  await expect(() => adapter.beginGame(context.game, context.roundLength)).rejects.toThrow(
    'Cannot start game: too few players',
  );
  await expect(() => adapter.beginGame(context.game, 1000)).rejects.toThrow(
    'Cannot start game: round length too short',
  );
  await expect(() => adapter.beginGame(context.game, 1000000000)).rejects.toThrow(
    'Cannot start game: round length too long',
  );
  // Bad attempts should count
  expect(statusUpdated).toBeCalledTimes(1);
  await adapter.joinGame(context.game, 'validPlayer3');
  await expect(adapter.beginGame(context.game, context.roundLength)).resolves.toBeUndefined();

  expect(statusUpdated).toBeCalledTimes(2);
  expect(status).toEqual({ started: true, finished: false });
  await expect(adapter.getGameStatus(context.game)).resolves.toEqual({ started: true, finished: false });
});

await test('active game', async () => {
  const currentRoundData = await adapter.getRoundData(context.game);
  // Expect less than a second between the last test and this since it should all be local
  expect(currentRoundData.endTime - adapter.now).toBeGreaterThan(context.roundLength - 1000);
  expect(currentRoundData.endTime - adapter.now).toBeLessThan(context.roundLength);
  expect(currentRoundData.roundnumber).toBe(0);

  const staticRoundInfo = await adapter.getStaticRoundInfo(context.game);
  expect(staticRoundInfo).toEqual({
    lastRound: 2,
    roundLength: context.roundLength,
  });
  context.staticRoundInfo = staticRoundInfo;

  const toAndFrom = await adapter.getToAndFrom(context.game, context.host);
  expect(toAndFrom.to).toMatch(/^validPlayer\d$/);
  expect(toAndFrom.from).toMatch(/^validPlayer\d$/);
  expect(toAndFrom.to === toAndFrom.from).toBe(false);

  await expect(adapter.fetchFinishedRounds(context.game)).resolves.toEqual({
    [context.host]: -1,
    validPlayer2: -1,
    validPlayer3: -1,
  });

  await expect(adapter.fetchFinishedRound(context.game, context.host)).resolves.toBe(-1);
});

await test('game state and normal play - round 1', async () => {
  let playerStatus;
  let roundData;
  let psResolve;
  let rdResolve;
  const listenersAdded = new Promise<void>(r => {
    let ps = false;
    let rd = false;
    psResolve = () => {
      psResolve = undefined;
      ps = true;
      if (rd) {
        r();
      }
    };
    rdResolve = () => {
      rdResolve = undefined;
      rd = true;
      if (ps) {
        r();
      }
    };
  });
  const roundUpdated = vi.fn(v => {
    rdResolve?.();
    roundData = v;
  });
  const playerStatusUpdated = vi.fn(v => {
    psResolve?.();
    playerStatus = v;
  });

  adapter.onRoundChange(context.game, roundUpdated);
  adapter.onPlayerStatusChange(context.game, playerStatusUpdated);

  await listenersAdded;

  expect(roundUpdated).toBeCalledTimes(1);
  expect(playerStatusUpdated).toBeCalledTimes(1);

  expect(roundData.roundnumber).toBe(0);
  expect(playerStatus).toEqual({
    [context.host]: -1,
    validPlayer2: -1,
    validPlayer3: -1,
  });

  await adapter.submitRound(
    context.game,
    context.host,
    0,
    'Round 1 Text',
    context.staticRoundInfo as StaticRoundInfo,
  );

  expect(playerStatus).toEqual({
    [context.host]: 0,
    validPlayer2: -1,
    validPlayer3: -1,
  });

  const card = await adapter.fetchCard(context.game, context.host, 0);
  expect(card).toBeDefined();
  expect(card!.contentType).toBe('text');
  expect(card!.content).toBe('Round 1 Text');

  // This should do nothing because it's been too soon
  await adapter.submitRound(
    context.game,
    'validPlayer2',
    0,
    'Round 1 Text',
    context.staticRoundInfo as StaticRoundInfo,
  );
  expect(playerStatus).toEqual({
    [context.host]: 0,
    validPlayer2: -1,
    validPlayer3: -1,
  });

  // This doesn't happen in practical use, but lets us test multiple submissions in a row
  adapter.lastSubmission = null;
  await adapter.submitRound(
    context.game,
    'validPlayer2',
    0,
    'Round 1 Text - p2',
    context.staticRoundInfo as StaticRoundInfo,
  );

  expect(playerStatus).toEqual({
    [context.host]: 0,
    validPlayer2: 0,
    validPlayer3: -1,
  });

  // The failed attempt should not have updated player status
  expect(playerStatusUpdated).toBeCalledTimes(3);

  adapter.lastSubmission = null;
  await adapter.submitRound(
    context.game,
    'validPlayer3',
    0,
    'Round 1 Text - p3',
    context.staticRoundInfo as StaticRoundInfo,
  );

  expect(playerStatus).toEqual({
    [context.host]: 0,
    validPlayer2: 0,
    validPlayer3: 0,
  });

  // After all players moved, round number should bump
  expect(roundData.roundnumber).toBe(1);
  expect(roundUpdated).toBeCalledTimes(2);

  // No overriding old rounds
  adapter.lastSubmission = null;
  await expect(
    adapter.submitRound(
      context.game,
      context.host,
      0,
      'Round 1 text override',
      context.staticRoundInfo as StaticRoundInfo,
    ),
  ).rejects.toThrow('');

  // Text in image round is nono
  adapter.lastSubmission = null;
  await expect(() =>
    adapter.submitRound(
      context.game,
      context.host,
      1,
      'Round 2 text',
      context.staticRoundInfo as StaticRoundInfo,
    ),
  ).rejects.toThrow('');

  adapter.lastSubmission = null;
  await adapter.submitRound(
    context.game,
    context.host,
    1,
    undefined,
    context.staticRoundInfo as StaticRoundInfo,
  );

  expect(playerStatus).toEqual({
    [context.host]: 1,
    validPlayer2: 0,
    validPlayer3: 0,
  });
});
