import { expect, test } from 'vitest';
import { useAccessor } from '../src/accessors';

class AccessorTest {
  num?: number;
  str?: string;
  bool?: boolean;
  obj?: Record<string, string>;
  arr?: string[];

  accessorList = ['num', 'str', 'bool', 'obj', 'arr'] as const;

  on = useAccessor<AccessorTest>(this);
}

class AccessorTestNotAll {
  num?: number;
  str?: string;
  bool?: boolean;
  obj?: Record<string, string>;
  arr?: string[];

  accessorList = ['num', 'str', 'bool'] as const;

  on = useAccessor<AccessorTestNotAll>(this);
}

test('Accessor initializes', () => {
  const ex = new AccessorTest();
  expect(Object.getOwnPropertyDescriptor(ex, 'num')?.get).toBeDefined();
  expect(Object.getOwnPropertyDescriptor(ex, 'num')?.set).toBeDefined();
  expect(typeof ex.on).toBe('function');
  const unsub = ex.on('num', v => v);
  expect(typeof unsub).toBe('function');
});

test('Accessor listens', () => {
  const ex = new AccessorTest();
  let sideEffect: number | string | undefined;
  const unsub = ex.on('num', v => (sideEffect = v));
  ex.num = 4;
  expect(sideEffect).toBe(4);
  const unsubStr = ex.on('str', v => (sideEffect = v));
  ex.str = 'hello';
  expect(sideEffect).toBe('hello');
  unsub();
  ex.num = 2;
  expect(sideEffect).toBe('hello');
  ex.str = 'Hello!';
  expect(sideEffect).toBe('Hello!');
  unsubStr();
  ex.str = 'lastone';
  expect(sideEffect).toBe('Hello!');
});

test('Accessor only affects given props', () => {
  const ex = new AccessorTestNotAll();
  expect(Object.getOwnPropertyDescriptor(ex, 'num')?.get).toBeDefined();
  expect(Object.getOwnPropertyDescriptor(ex, 'num')?.set).toBeDefined();
  expect(Object.getOwnPropertyDescriptor(ex, 'arr')?.get).toBeUndefined();
  expect(Object.getOwnPropertyDescriptor(ex, 'arr')?.set).toBeUndefined();
});

test('Accessor listens to complex value top level', () => {
  const ex = new AccessorTest();
  let a: string[] | undefined = [];
  const aUnsub = ex.on('arr', v => (a = v?.slice()));
  ex.arr = ['1'];
  expect(a).toEqual(['1']);
  ex.arr.push('2');
  expect(a).toEqual(['1']);
  ex.arr = [...ex.arr, '3'];
  expect(a).toEqual(['1', '2', '3']);
  aUnsub();
  ex.arr = ['5'];
  expect(a).toEqual(['1', '2', '3']);

  let o: Record<string, string> | undefined;
  const oUnsub = ex.on('obj', v => (o = { ...v }));
  ex.obj = { a: '1' };
  expect(o).toEqual({ a: '1' });
  ex.obj['b'] = '2';
  expect(o).toEqual({ a: '1' });
  ex.obj.c = '3';
  expect(o).toEqual({ a: '1' });
  ex.obj = { ...ex.obj, d: '4' };
  expect(o).toEqual({ a: '1', b: '2', c: '3', d: '4' });
  oUnsub();
  ex.obj = { hello: 'world' };
  expect(o).toEqual({ a: '1', b: '2', c: '3', d: '4' });
});
