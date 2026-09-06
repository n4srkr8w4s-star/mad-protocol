import {
  RobinhoodHttpError,
  type RobinhoodPriceQuote,
} from "../adapters/robinhood/prices.js";

export type RetryingRobinhoodPriceLookup =
  (
    symbol: string,
  ) => Promise<RobinhoodPriceQuote>;

export interface RetryingRobinhoodPriceLookupOptions {
  lookup:
    RetryingRobinhoodPriceLookup;

  maxAttempts?: number;

  baseBackoffMs?: number;

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

function isRetryableRateLimit(
  error: unknown,
): error is RobinhoodHttpError {
  return (
    error instanceof RobinhoodHttpError &&
    error.status === 429
  );
}

export function createRetryingRobinhoodPriceLookup(
  options:
    RetryingRobinhoodPriceLookupOptions,
): RetryingRobinhoodPriceLookup {
  const maxAttempts =
    options.maxAttempts ?? 3;

  const baseBackoffMs =
    options.baseBackoffMs ?? 1_000;

  const sleep =
    options.sleep ??
    defaultSleep;

  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1
  ) {
    throw new Error(
      "Robinhood price max attempts must be a positive integer.",
    );
  }

  if (
    !Number.isFinite(baseBackoffMs) ||
    baseBackoffMs < 0
  ) {
    throw new Error(
      "Robinhood price backoff must be zero or greater.",
    );
  }

  return async (
    symbol: string,
  ): Promise<RobinhoodPriceQuote> => {
    let attempt = 1;

    while (true) {
      try {
        return await options.lookup(
          symbol,
        );
      } catch (error) {
        if (
          !isRetryableRateLimit(
            error,
          ) ||
          attempt >= maxAttempts
        ) {
          throw error;
        }

        /*
         * Bounded exponential backoff:
         *
         * attempt 1 failure -> 1x base
         * attempt 2 failure -> 2x base
         *
         * With maxAttempts=3 there are
         * at most two waits and three
         * total upstream attempts.
         */
        const backoffMs =
          baseBackoffMs *
          2 ** (attempt - 1);

        await sleep(
          backoffMs,
        );

        attempt += 1;
      }
    }
  };
}
