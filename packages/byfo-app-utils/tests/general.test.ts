import { expect, test } from 'vitest';
import * as src from '../src/general';

test('sortNames', () => {
  expect(src.sortNames(['a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
  expect(src.sortNames(['a', 'C', 'b'])).toEqual(['a', 'b', 'C']);
  expect(src.sortNames(['a', 'B', 'c'])).toEqual(['a', 'B', 'c']);
});

test('sortNameMap', () => {
  expect(src.sortNameMap({ a: 5, b: 6, c: 7 })).toEqual([
    ['a', 5],
    ['b', 6],
    ['c', 7],
  ]);
});

test('encodePath', () => {
  const example = '$[Name]#2.5';
  const encoded = '%24%5BName%5D%232%2E5';
  expect(src.encodePath(example)).toBe(encoded);
  expect(src.decodePath(encoded)).toBe(example);
  expect(src.decodePath(src.encodePath(example))).toBe(example);
  expect(src.encodePath(src.decodePath(encoded))).toBe(encoded);
});

test('gameId', () => {
  expect(src.isValidGameId('1')).toBe(true);
  expect(src.isValidGameId('123456')).toBe(true);
  expect(src.isValidGameId('1234567')).toBe(true);
  expect(src.isValidGameId('12345678')).toBe(false);
  expect(src.isValidGameId('1.234')).toBe(false);
  expect(src.isValidGameId('123a')).toBe(false);
});

test('username', () => {
  expect(src.isValidUsername('Jacob')).toBe(true);
  expect(src.isValidUsername('Jacob#2')).toBe(true);
  expect(src.isValidUsername('"Jacob"[a]')).toBe(true);
  expect(src.isValidUsername('Jacob@^3.5.4')).toBe(true);
  expect(
    src.isValidUsername(`Jacob
on
multiple
lines`),
  ).toBe(true);
  expect(src.isValidUsername(``)).toBe(false);
  expect(src.isValidUsername(`    `)).toBe(false);
  expect(src.isValidUsername(`\t  `)).toBe(false);
  expect(src.isValidUsername(`\n  `)).toBe(false);
  expect(() => src.isValidUsername(`Jacob/slash`)).toThrowError(/^Names cannot contain/);
  expect(() => src.isValidUsername(`Jacob\\/slash`)).toThrowError(/^Names cannot contain/);
  expect(() => src.isValidUsername(`Jacob\\backslash`)).toThrowError(/^Names cannot contain/);
  expect(() => src.isValidUsername('a'.repeat(100))).toThrowError(
    /^Names cannot exceed (\d+) characters. 100\/\1/,
  );
});

test('invalidCharacters', () => {
  expect(src.invalidCharactersList('nothing bad here')).toBe('');
  expect(src.invalidCharactersList('with/slash')).toBe('/');
  expect(src.invalidCharactersList('with\\backslash')).toBe('\\');
  expect(src.invalidCharactersList('with/both\\slashes')).toBe('/ or \\');
  expect(src.invalidCharactersList('with\\both/slashes')).toBe('\\ or /');
});
