import type { BYFOStore } from './storage';
import { BYFOConfig, config as defaultGameConfig } from './config';
import { type BYFOFirebaseAdapter, Player, PlayerList } from './firebase';
import { RouteResult } from './routing';

export const stopPropagation = (e: Event) => e.stopPropagation();

const invalidUsernameCharacters = ['/', '\\'];

//#region Strings
/**
 * Sorts a list of strings case-insensitively
 * @param names - An array of names as string
 * @returns - A sorted array with the same strings
 */
export function sortNames(names: string[]) {
  return names.sort((a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

/**
 * Sorts a list of username objects by the given key
 * @param names - An array of objects that contain the names to be sorted
 * @param sortKey - The object prop containing the name
 * @returns A sorted list of the objects
 */
export function sortNamesBy<T extends { [key: string]: unknown }>(names: T[], sortKey: keyof T): typeof names;
export function sortNamesBy(names: unknown[][], sortKey: number): typeof names;
export function sortNamesBy<T extends { [key: string | number]: unknown }>(names: (Record<string, unknown> | unknown[])[], sortKey: string | number) {
  const keyMap = new Map<string, T>();
  const nameArray: string[] = [];
  names.forEach((obj: T) => {
    if (typeof obj[sortKey] !== 'string') {
      throw new Error('Unexpected non-string value used as name');
    }
    const name = obj[sortKey] as string;
    nameArray.push(name);
    keyMap.set(name, obj);
  });
  const keyOrder = nameArray.sort((a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return keyOrder.map(name => keyMap.get(name));
}

/**
 * Calculates the amount of space to give the player names for list purposes.
 * Front-end heavy, reconsider this if changing the front end
 * @param players - a list of player objects
 * @returns The css width for the player section of a list, such as between rounds
 */
export function calculatePlayerNameWidth(players: Player[]) {
  let max = 0;
  players.forEach(player => {
    if (player.username?.length > max) {
      max = player.username?.length;
    }
  });
  const value = 50 + (40 * max) / 32;
  return `${value}%`;
}

/**
 * Encodes the characters that are invalid in firebase paths as HTML escapes
 * @param path A firebase path string
 * @returns The string with no invalid characters
 */
export function encodePath(path: string) {
  return path.replaceAll('.', '%2E').replaceAll('#', '%23').replaceAll('$', '%24').replaceAll('[', '%5B').replaceAll(']', '%5D');
}

/**
 * Generates the proper string from an encoded path
 * @see encodePath
 * @param path The encoded path to decode
 * @returns A string with certain html encoding undone
 */
export function decodePath(path: string) {
  return path.replaceAll('%2E', '.').replaceAll('%23', '#').replaceAll('%24', '$').replaceAll('%5B', '[').replaceAll('%5D', ']');
}
//#endregion Strings

//#region Regexp
/**
 * Checks if a game id is valid
 * @param input - A potential gameid
 * @returns True if the input is a gameid, false otherwise
 * @deprecated
 */
export function validGameId(input: string) {
  const exp = /^[0-9]{1,7}$/;
  return exp.test(input);
}

/**
 * Checks if a game id is valid
 * @param input - A potential gameid
 * @returns True if the input is a gameid, false otherwise
 */
export function isValidGameId(input: string) {
  const exp = /^[0-9]{1,7}$/;
  return exp.test(input);
}

/**
 * Checks if a username is valid
 * @param input - A potential username
 * @returns True if the name is within max length and does not contain invalid characters
 */
export function validUsername(input?: string, maxCharacters?: number): boolean | string {
  if (!input || !input.trim()) {
    return false;
  }
  if (input === '__host') {
    return `__host is a reserved name`;
  }
  const maxName = maxCharacters ?? defaultGameConfig.usernameMaxCharacters;
  if (input.length > maxName) {
    return `Names cannot exceed ${maxName} characters. ${input.length}/${maxName}`;
  }
  const invalidCharacters = invalidCharactersList(input);
  return invalidCharacters ? `Names cannot contain ${invalidCharacters}` : true;
}

/**
 * Checks if a username is valid
 * @param input - A potential username
 * @returns true if the name is valid, false if the string is empty
 * @throws The reason it is invalid, if it is invalid but not empty
 */
export function isValidUsername(input?: string, maxCharacters?: number): boolean {
  if (!input || !input.trim()) {
    return false;
  }
  if (input === '__host') {
    throw new Error(`__host is a reserved name`);
  }
  const maxName = maxCharacters ?? defaultGameConfig.usernameMaxCharacters;
  if (input.length > maxName) {
    throw new Error(`Names cannot exceed ${maxName} characters. ${input.length}/${maxName}`);
  }
  const invalidCharacters = invalidCharactersList(input);
  if (invalidCharacters) {
    throw new Error(`Names cannot contain ${invalidCharacters}`);
  }
  return true;
}

/**
 * Checks *which* characters are invalid within a given string
 * @param input - The string to be checked
 * @returns A comma separated list of invalid characters which appear in the input
 */
export function invalidCharactersList(input: string) {
  const badCharactersUsed = new Set<string>();
  for (let i = 0; i < input.length; i++) {
    if (invalidUsernameCharacters.includes(input[i])) {
      badCharactersUsed.add(input[i]);
      if (badCharactersUsed.size === invalidUsernameCharacters.length) {
        break;
      }
    }
  }
  const rawList = [...badCharactersUsed];

  if (rawList.length === 1) {
    return rawList[0];
  }

  if (rawList.length === 2) {
    return rawList.join(' or ');
  }

  const stringList = rawList.join(', ');
  return stringList.replace(/, ([^,]+)$/, ', or $1');
}
//#endregion Regexp

export const control = 'ctrl+';
export const alt = 'alt+';
export const shift = 'shift+';
export const meta = 'meta+';
export function stringifyKeystroke(event: KeyboardEvent) {
  const { key, ctrlKey, shiftKey, altKey, metaKey } = event;
  let code = '';
  if (ctrlKey) code += control;
  if (altKey) code += alt;
  if (metaKey) code += meta;
  if (shiftKey) code += shift;
  const letter = key.toLowerCase();
  if (!['control', 'shift', 'alt', 'meta'].includes(letter)) {
    code += letter;
  }
  return code;
}
export function useKeystrokes(map: Record<string, () => void>, logger?: (v: string) => void) {
  return (event: KeyboardEvent) => {
    const code = stringifyKeystroke(event);
    if (logger) {
      logger(code);
    }
    if (code in map) {
      map[code]();
    }
  };
}
