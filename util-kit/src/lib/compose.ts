// Copied as is from Redux https://github.dev/reduxjs/redux/blob/master/test/typescript/compose.ts

type Func<T extends any[], R> = (...a: T) => R;

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for the
 * resulting composite function.
 *
 * @param funcs The functions to compose.
 * @returns A function obtained by composing the argument functions from right
 *   to left. For example, `compose(f, g, h)` is identical to doing
 *   `(...args) => f(g(h(...args)))`.
 */
export function composeReducers(): <R>(a: R) => R;

export function composeReducers<F extends Function>(f: F): F;

/* two functions */
export function composeReducers<A, T extends any[], R>(
  f1: (a: A, ...rest: T) => R,
  f2: Func<T, A>
): Func<T, R>;

/* three functions */
export default function composeReducers<A, B, T extends any[], R>(
  f1: (b: B, ...rest: T) => R,
  f2: (a: A, ...rest: T) => B,
  f3: Func<T, A>
): Func<T, R>;

/* four functions */
export function composeReducers<A, B, C, T extends any[], R>(
  f1: (c: C, ...rest: T) => R,
  f2: (b: B, ...rest: T) => C,
  f3: (a: A, ...rest: T) => B,
  f4: Func<T, A>
): Func<T, R>;

/* rest */
export function composeReducers<R>(
  f1: (a: any) => R,
  ...funcs: Function[]
): (...args: any[]) => R;

export function composeReducers<R>(...funcs: Function[]): (...args: any[]) => R;

export function composeReducers(...funcs: Function[]) {
  if (funcs.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return <T>(arg: T) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  // This was modified to include the ...rest of the args in a fn by Gabe
  return funcs.reduce(
    (prevFn, nextFn) =>
      (a: any, ...rest: any[]) =>
        prevFn(nextFn(a, ...rest), ...rest)
  );
}
