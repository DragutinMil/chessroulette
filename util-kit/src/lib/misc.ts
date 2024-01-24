// import fastDeepEquals from 'fast-deep-equal/es6';

/**
 * https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
 *
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
export function getRandomInt(givenMin: number, givenMax: number) {
  const min = Math.ceil(givenMin);
  const max = Math.floor(givenMax);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const noop = (..._: any[]) => {};

export const flatten = <T>(a: T[]) =>
  a.reduce((accumulator, value) => accumulator.concat(value), [] as T[]);

export const invoke = <T>(fn: () => T): T => fn();

export function toDictIndexedBy<
  O,
  KGetter extends (o: O) => string
>(list: O[], getKey: KGetter): { [k: string]: O };
export function toDictIndexedBy<
  O,
  KGetter extends (o: O) => string,
  V
>(list: O[], getKey: KGetter, getVal: (o: O) => V): { [k: string]: V };
export function toDictIndexedBy<
  O,
  KGetter extends (o: O) => string,
  V
>(list: O[], getKey: KGetter, getVal?: (o: O) => V) {
  if (getVal) {
    return list.reduce(
      (prev, next) => ({
        ...prev,
        [getKey(next)]: getVal(next),
      }),
      {} as { [k: string]: V }
    );
  }

  return list.reduce(
    (prev, next) => ({
      ...prev,
      [getKey(next)]: next,
    }),
    {} as { [k: string]: O }
  );
}

export const objectKeys = <O extends object>(o: O) =>
  Object.keys(o) as (keyof O)[];

// Use this to get inherited keys as well
export const keyInObject = <X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> => prop in obj;

type TupleToUnionType<T extends any[]> = T[number];

export const isOneOf = <T extends string, List extends T[]>(
  k: T | undefined,
  listOfOptions: List
): k is TupleToUnionType<List> => listOfOptions.indexOf(k) > -1;
