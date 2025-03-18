import { expect, test } from 'vitest';
import * as src from '../src/general';

test('sortNames', () => {
  expect(src.sortNames(['a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
  expect(src.sortNames(['a', 'C', 'b'])).toEqual(['a', 'b', 'C']);
  expect(src.sortNames(['a', 'B', 'c'])).toEqual(['a', 'B', 'c']);
});

test('sortNamesBy', () => {
  expect(src.sortNamesBy([{ name: 'a' }, { name: 'c' }, { name: 'b' }], 'name')).toEqual([
    { name: 'a' },
    { name: 'b' },
    { name: 'c' },
  ]);
  expect(
    src.sortNamesBy(
      [
        { name: 'a', id: 'd' },
        { name: 'c', id: 'e' },
        { name: 'b', id: 'f' },
      ],
      'id',
    ),
  ).toEqual([
    { name: 'a', id: 'd' },
    { name: 'c', id: 'e' },
    { name: 'b', id: 'f' },
  ]);
  expect(() =>
    src.sortNamesBy(
      [
        { name: 'a', id: 'd' },
        { name: 'c', id: 'e' },
        { name: 'b', id: 2 },
      ],
      'id',
    ),
  ).toThrowError('Unexpected non-string value used as name');
  expect(src.sortNamesBy([{ name: 'a' }, { name: 'C' }, { name: 'b' }], 'name')).toEqual([
    { name: 'a' },
    { name: 'b' },
    { name: 'C' },
  ]);
  expect(src.sortNamesBy([{ name: 'a' }, { name: 'B' }, { name: 'c' }], 'name')).toEqual([
    { name: 'a' },
    { name: 'B' },
    { name: 'c' },
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
  expect(src.validGameId('1')).toBe(true);
  expect(src.validGameId('123456')).toBe(true);
  expect(src.validGameId('1234567')).toBe(true);
  expect(src.validGameId('12345678')).toBe(false);
  expect(src.validGameId('1.234')).toBe(false);
  expect(src.validGameId('123a')).toBe(false);
});

test('username', () => {
  expect(src.validUsername('Jacob')).toBe(true);
  expect(src.validUsername('Jacob#2')).toBe(true);
  expect(src.validUsername('"Jacob"[a]')).toBe(true);
  expect(src.validUsername('Jacob@^3.5.4')).toBe(true);
  expect(
    src.validUsername(`Jacob
on
multiple
lines`),
  ).toBe(true);
  expect(src.validUsername(``)).toBe(false);
  expect(src.validUsername(`    `)).toBe(false);
  expect(src.validUsername(`\t  `)).toBe(false);
  expect(src.validUsername(`\n  `)).toBe(false);
  expect(src.validUsername(`Jacob/slash`)).toMatch(/^Names cannot contain/);
  expect(src.validUsername(`Jacob\\/slash`)).toMatch(/^Names cannot contain/);
  expect(src.validUsername(`Jacob\\backslash`)).toMatch(/^Names cannot contain/);
  expect(src.validUsername('a'.repeat(100))).toMatch(/^Names cannot exceed (\d+) characters. 100\/\1/);
});

test('invalidCharacters', () => {
  expect(src.invalidCharactersList('nothing bad here')).toBe('');
  expect(src.invalidCharactersList('with/slash')).toBe('/');
  expect(src.invalidCharactersList('with\\backslash')).toBe('\\');
  expect(src.invalidCharactersList('with/both\\slashes')).toBe('/ or \\');
  expect(src.invalidCharactersList('with\\both/slashes')).toBe('\\ or /');
});
