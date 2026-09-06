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

    dailyTradingVolume:
      "0",

    isTradingHalt:
      false,

    generatedAt:
      "2026-09-06T00:00:00.000Z",

    dailyHigh: "101",
    dailyLow: "99",

    mintBurnTokenVolume:
      "0",

    mintBurnUsdVolume:
      "0",
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
  "retrying Robinhood price lookup",
  () => {
    it(
      "retries a 429 and returns the recovered quote",
      async () => {
        let calls = 0;

        const waits:
          number[] = [];

        const lookup =
          createRetryingRobinhoodPriceLookup({
            maxAttempts: 3,

            baseBackoffMs:
              1_000,

            sleep:
              async (
                milliseconds,
              ) => {
                waits.push(
                  milliseconds,
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

        await expect(
          lookup("AAPL"),
        ).resolves.toMatchObject({
          tokenSymbol:
            "AAPL",
        });

        expect(calls).toBe(2);

        expect(
          waits,
        ).toEqual([
          1_000,
        ]);
      },
    );

    it(
      "uses bounded exponential backoff for repeated 429s",
      async () => {
        let calls = 0;

        const waits:
          number[] = [];

        const lookup =
          createRetryingRobinhoodPriceLookup({
            maxAttempts: 3,

            baseBackoffMs:
              1_000,

            sleep:
              async (
                milliseconds,
              ) => {
                waits.push(
                  milliseconds,
                );
              },

            lookup:
              async () => {
                calls += 1;

                throw rateLimitError();
              },
          });

        await expect(
          lookup("AAPL"),
        ).rejects.toMatchObject({
          status: 429,

          responseBody:
            "local_rate_limited",
        });

        expect(calls).toBe(3);

        expect(
          waits,
        ).toEqual([
          1_000,
          2_000,
        ]);
      },
    );

    it(
      "does not retry non-429 HTTP failures",
      async () => {
        let calls = 0;

        const waits:
          number[] = [];

        const lookup =
          createRetryingRobinhoodPriceLookup({
            sleep:
              async (
                milliseconds,
              ) => {
                waits.push(
                  milliseconds,
                );
              },

            lookup:
              async () => {
                calls += 1;

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

        expect(calls).toBe(1);

        expect(
          waits,
        ).toEqual([]);
      },
    );

    it(
      "does not retry non-HTTP failures",
      async () => {
        let calls = 0;

        const lookup =
          createRetryingRobinhoodPriceLookup({
            lookup:
              async () => {
                calls += 1;

                throw new Error(
                  "invalid price payload",
                );
              },
          });

        await expect(
          lookup("AAPL"),
        ).rejects.toThrow(
          "invalid price payload",
        );

        expect(calls).toBe(1);
      },
    );
  },
);
