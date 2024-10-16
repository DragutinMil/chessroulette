import { isLeft, Either } from 'fp-ts/lib/Either';
import { objectKeys } from 'movex-core-util';
import { Err, Ok, Result } from 'ts-results';
import { AnyAction, MovexReducer } from 'movex-core-util';
import * as deepObject from 'deep-object-diff';
import { isObject } from '@xmatter/util-kit';

// TODO: This might not need to use Eithe
export const eitherToResult = <T, E>(either: Either<E, T>): Result<T, E> => {
  if (isLeft(either)) {
    return new Err(either.left);
  }

  return new Ok(either.right);
};

export const formatURLSearchParams = (
  href: string,
  searchParams?: Record<string, string | number>
): string => {
  const url = new URL(href);

  if (searchParams) {
    objectKeys(searchParams).forEach((key) => {
      url.searchParams.set(key, String(searchParams[key]));
    });
  }

  return url.href;
};

export const reducerLogger = <S, A extends AnyAction>(
  reducer: MovexReducer<S, A>,
  name = ''
) => {
  return (s: S, a: A) => {
    const next = reducer(s, a);

    // TODO: Move this here in a logger middleware
    console.group(`${name} Action:`, a.type);
    console.log('Payload:', (a as any).payload);
    console.log('Prev:', s);
    console.log('Next:', next);
    if (isObject(s) && isObject(next)) {
      console.log('Detailed Diff', deepObject.detailedDiff(s, next));
      console.log('Simple Diff', deepObject.diff(s, next));
    } else {
      console.log('Diff is between primitives');
    }
    console.groupEnd();

    return next;
  };
};
