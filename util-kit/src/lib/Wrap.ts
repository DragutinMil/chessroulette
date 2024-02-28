interface Wrap<T> {
  map<T2>(transformFn: (val: T) => T2): Wrap<T2>;

  mapOr<T2>(transformFn: (val: T) => T2): Wrap<T2>;
}

class Wrap<T> implements Wrap<T> {
  constructor(public val: T) {}

  orIf<T2>(
    conditionFn: (val: T) => boolean,
    elseMapFn: (val: T) => T2
  ) {
    if (conditionFn(this.val) === true) {
      return new WrapElse(elseMapFn(this.val));
    }

    return this;
  }

  map<F>(transformFn: (val: T) => F) {
    return new Wrap(transformFn(this.val));
  }

  mapOr<F>(transformFn: (val: T) => F) {
    return this;
  }

  // ifNot(conditionFn: (val: T) => boolean) {}
}

class WrapElse<T> extends Wrap<T> {
  override map<F>(transformFn: (val: T) => F) {
    return this;
  }
}

export const wrap = <T>(val: T) => new Wrap(val);
