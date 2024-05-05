import { invoke, toDictIndexedBy } from '@xmatter/util-kit';
import { isLeft, Either } from 'fp-ts/lib/Either';
import { objectKeys } from 'movex-core-util';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Err, Ok, Result } from 'ts-results';

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

export const chessGameTypeTimeDisplay = (time: number) => {
  if (time < 60000) {
    return `${Math.floor(time / 1000)} seconds`;
  }
  const result = Math.floor(time / 60000);
  return `${result} ${result === 1 ? 'minute' : 'minutes'}`;
};
