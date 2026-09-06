import {
  RobinhoodHttpError,
  type RobinhoodPriceQuote,
} from "../adapters/robinhood/prices.js";

export type RetryingRobinhoodPriceLookup =
  (
    symbol: string,
  ) => Promise<RobinhoodPriceQuote>;

export type RobinhoodPriceRetryEvent =
  | {
      type: "ATTEMPT_STARTED";
      symbol: string;
      attempt: number;
      maxAttempts: number;
    }
  | {
      type: "RATE_LIMITED";
      symbol: string;
      attempt: number;
      maxAttempts: number;
      responseBody: string | null;
    }
  | {
      type: "SUCCEEDED";
      symbol: string;
      attempts: number;
      recoveredFromRateLimit: boolean;
    }
  | {
      type: "EXHAUSTED";
      symbol: string;
      attempts: number;
      status: 429;
      responseBody: string | null;
    }
  | {
      type: "NON_RETRYABLE_FAILURE";
      symbol: string;
      attempt: number;
      status: number | null;
    };

export interface RetryingRobinhoodPriceLookupOptions {
  lookup:
    RetryingRobinhoodPriceLookup;

  maxAttempts?: number;

  baseBackoffMs?: number;

  sleep?: (
    milliseconds: number,
  ) => Promise<void>;

  onEvent?: (
    event: RobinhoodPriceRetryEvent,
  ) => void;
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

  /*
   * Telemetry must never interfere with evidence
   * acquisition. A consumer bug in an observability
   * callback must not change the price lookup result.
   */
  function emit(
    event: RobinhoodPriceRetryEvent,
  ) {
    try {
      options.onEvent?.(
        event,
      );
    } catch {
      // Observability is non-authoritative.
    }
  }

  return async (
    symbol: string,
  ): Promise<RobinhoodPriceQuote> => {
    let attempt = 1;

    while (true) {
      emit({
        type:
          "ATTEMPT_STARTED",

        symbol,

        attempt,

        maxAttempts,
      });

      try {
        const result =
          await options.lookup(
            symbol,
          );

        emit({
          type:
            "SUCCEEDED",

          symbol,

          attempts:
            attempt,

          recoveredFromRateLimit:
            attempt > 1,
        });

        return result;
      } catch (error) {
        if (
          isRetryableRateLimit(
            error,
          )
        ) {
          emit({
            type:
              "RATE_LIMITED",

            symbol,

            attempt,

            maxAttempts,

            responseBody:
              error.responseBody,
          });

          if (
            attempt >=
            maxAttempts
          ) {
            emit({
              type:
                "EXHAUSTED",

              symbol,

              attempts:
                attempt,

              status: 429,

              responseBody:
                error.responseBody,
            });

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

          continue;
        }

        emit({
          type:
            "NON_RETRYABLE_FAILURE",

          symbol,

          attempt,

          status:
            error instanceof
            RobinhoodHttpError
              ? error.status
              : null,
        });

        throw error;
      }
    }
  };
}
