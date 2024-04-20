import { UnsubscribeFn } from 'movex-core-util';
import { Pubsy } from 'ts-pubsy';

// export const bufferUntil = <T>(
//   list: T[],
//   untilCondition: (item: T) => boolean
// ) => {
//   list.push();
// };

export class ConditionalBuffer<T> {
  private backlog: T[] = [];

  private pubsy = new Pubsy<{ onFinished: T[] }>();

  private offFinished?: UnsubscribeFn;

  /**
   *
   * @param untilCondition when the untilConition returns TRUE it stop and get is called
   */
  constructor(private untilCondition: (item: T) => boolean) {}

  // until() {}

  push(item: T) {
    this.backlog.push(item);

    if (this.untilCondition(item)) {
      this.pubsy.publish('onFinished', this.backlog);

      // Reset the backlog
      this.backlog = [];

      // Unsubscribe
      this.offFinished?.();
    }
  }

  get() {
    return new Promise<T[]>((resolve) => {
      this.offFinished = this.pubsy.subscribe('onFinished', resolve);
    });
  }
}
