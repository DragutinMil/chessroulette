import { isLeft, Either } from 'fp-ts/lib/Either';
import { objectKeys } from 'movex-core-util';
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
