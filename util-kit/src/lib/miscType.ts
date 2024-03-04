export type GetComponentProps<T> = T extends
  | React.ComponentType<infer P>
  | React.Component<infer P>
  ? P
  : never;

export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type Ensure<T, K extends keyof T> = T &
  Required<RequiredNotNull<Pick<T, K>>>;

/**
 * Taken from https://stackoverflow.com/a/67794430/2093626
 * This ensures the omit doesn't break distributin uniions!
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends any
  ? Omit<T, K>
  : never;

export type UnknownRecord = Record<string, unknown>;

export type StringKeys<TRecord extends UnknownRecord> = Extract<
  keyof TRecord,
  string
>;
