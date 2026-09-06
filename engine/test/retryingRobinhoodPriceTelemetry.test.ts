import {
  describe,
  expect,
  it,
} from "vitest";

import {
  RobinhoodHttpError,
  type RobinhoodPriceQuote,
} from "../src/adapters/robinhood/prices.js";

import {
  createRetryingRobinhoodPriceLookup,
  type RobinhoodPriceRetryEvent,
} from "../src/engine/retryingRobinhoodPriceLookup.js";

function quote(
  symbol: string,
): RobinhoodPriceQuote {
  return {
    tokenSymbol:
      symbol,

    deployments: [],

    bid: "100",
    ask: "101",
    currency: "USD",
    dailyTradingVolume: "0",
    isTradingHalt: false,

    generatedAt:
      "2026-09-06T00:00:00.000Z",

    dailyHigh: "101",
    dailyLow: "99",

    mintBurnTokenVolume: "0",
    mintBurnUsdVolume: "0",
  };
}

function rateLimitError() {
  return new RobinhoodHttpError({
    status: 429,

    endpoint:
      "https://api.robinhood.com/rhj/prices/AAPL",

    responseBody:
      "local_rate_limited",
  });
}

describe(
  "Robinhood price retry telemetry",
  () => {
    it(
      "records successful recovery from a rate limit",
      async () => {
        let calls = 0;

        const events:
          RobinhoodPriceRetryEvent[] = [];

        const lookup =
          createRetryingRobinhoodPriceLookup({
            baseBackoffMs: 0,

            sleep:
              async () => {},

            onEvent:
              (event) => {
                events.push(
                  event,
                );
              },

            lookup:
              async (symbol) => {
                calls += 1;

                if (calls === 1) {
                  throw rateLimitError();
                }

                return quote(
                  symbol,
                );
              },
          });

        await lookup(
          "AAPL",
        );

        expect(
          events.map(
            (event) =>
              event.type,
          ),
        ).toEqual([
          "ATTEMPT_STARTED",
          "RATE_LIMITED",
          "ATTEMPT_STARTED",
          "SUCCEEDED",
        ]);

        expect(
          events.at(-1),
        ).toMatchObject({
          type:
            "SUCCEEDED",

          symbol:
            "AAPL",

          attempts: 2,

          recoveredFromRateLimit:
            true,
        });
      },
    );

    it(
      "records exhausted rate limiting separately from recovery",
      async () => {
        const events:
          RobinhoodPriceRetryEvent[] = [];

        const lookup =
          createRetryingRobinhoodPriceLookup({
            maxAttempts: 2,

            baseBackoffMs: 0,

            sleep:
              async () => {},

            onEvent:
              (event) => {
                events.push(
                  event,
                );
              },

            lookup:
              async () => {
                throw rateLimitError();
              },
          });

        await expect(
          lookup("AAPL"),
        ).rejects.toMatchObject({
          status: 429,
        });

        expect(
          events.map(
            (event) =>
              event.type,
          ),
        ).toEqual([
          "ATTEMPT_STARTED",
          "RATE_LIMITED",
          "ATTEMPT_STARTED",
          "RATE_LIMITED",
          "EXHAUSTED",
        ]);

        expect(
          events.at(-1),
        ).toMatchObject({
          type:
            "EXHAUSTED",

          symbol:
            "AAPL",

          attempts: 2,

          status: 429,

          responseBody:
            "local_rate_limited",
        });
      },
    );

    it(
      "records non-retryable upstream failure without retrying",
      async () => {
        const events:
          RobinhoodPriceRetryEvent[] = [];

        const lookup =
          createRetryingRobinhoodPriceLookup({
            onEvent:
              (event) => {
                events.push(
                  event,
                );
              },

            lookup:
              async () => {
                throw new RobinhoodHttpError({
                  status: 503,

                  endpoint:
                    "https://api.robinhood.com/rhj/prices/AAPL",

                  responseBody:
                    "unavailable",
                });
              },
          });

        await expect(
          lookup("AAPL"),
        ).rejects.toMatchObject({
          status: 503,
        });

        expect(
          events,
        ).toEqual([
          {
            type:
              "ATTEMPT_STARTED",

            symbol:
              "AAPL",

            attempt: 1,

            maxAttempts: 3,
          },

          {
            type:
              "NON_RETRYABLE_FAILURE",

            symbol:
              "AAPL",

            attempt: 1,

            status: 503,
          },
        ]);
      },
    );
  },
);
