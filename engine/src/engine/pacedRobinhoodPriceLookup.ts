import {
  fetchRobinhoodPrice,
  type RobinhoodPriceQuote,
} from "../adapters/robinhood/prices.js";

export type RobinhoodPriceLookup = (
  symbol: string,
) => Promise<RobinhoodPriceQuote>;

export interface PacedRobinhoodPriceLookupOptions {
  /*
   * Minimum time between the start of successive
   * Robinhood /prices/{symbol} requests.
   *
   * 250 ms = maximum theoretical start rate of
   * four requests per second.
   */
  minIntervalMs?: number;

  fetchPrice?: RobinhoodPriceLookup;

  nowMs?: () => number;

  sleep?: (
    milliseconds: number,
  ) => Promise<void>;
}

function defaultSleep(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}

export function createPacedRobinhoodPriceLookup(
  options:
    PacedRobinhoodPriceLookupOptions = {},
): RobinhoodPriceLookup {
  const minIntervalMs =
    options.minIntervalMs ??
    250;

  if (
    !Number.isFinite(
      minIntervalMs,
    ) ||
    minIntervalMs < 0
  ) {
    throw new Error(
      "Robinhood price minimum interval must be zero or greater.",
    );
  }

  const fetchPrice =
    options.fetchPrice ??
    fetchRobinhoodPrice;

  const nowMs =
    options.nowMs ??
    (() => Date.now());

  const sleep =
    options.sleep ??
    defaultSleep;

  let lastStartedAtMs:
    number | undefined;

  /*
   * This is a shared queue.
   *
   * All callers use the same tail, so asset-level
   * concurrency cannot create an uncontrolled
   * /prices request burst.
   */
  let tail:
    Promise<void> =
      Promise.resolve();

  return (
    symbol: string,
  ): Promise<RobinhoodPriceQuote> => {
    const task =
      tail.then(
        async () => {
          if (
            lastStartedAtMs !==
            undefined
          ) {
            const elapsed =
              nowMs() -
              lastStartedAtMs;

            const remaining =
              minIntervalMs -
              elapsed;

            if (
              remaining > 0
            ) {
              await sleep(
                remaining,
              );
            }
          }

          lastStartedAtMs =
            nowMs();

          return fetchPrice(
            symbol,
          );
        },
      );

    /*
     * A failed price request must not poison
     * the queue for subsequent assets.
     */
    tail =
      task.then(
        () => undefined,
        () => undefined,
      );

    return task;
  };
}
