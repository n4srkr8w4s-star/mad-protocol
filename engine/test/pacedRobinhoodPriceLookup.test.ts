import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPacedRobinhoodPriceLookup,
} from "../src/engine/pacedRobinhoodPriceLookup.js";

import type {
  RobinhoodPriceQuote,
} from "../src/adapters/robinhood/prices.js";

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

describe(
  "paced Robinhood price lookup",
  () => {
    it(
      "paces concurrent requests by minimum start interval",
      async () => {
        let time = 0;

        const starts:
          number[] = [];

        const lookup =
          createPacedRobinhoodPriceLookup({
            minIntervalMs: 250,

            nowMs:
              () => time,

            sleep:
              async (
                milliseconds,
              ) => {
                time +=
                  milliseconds;
              },

            fetchPrice:
              async (symbol) => {
                starts.push(
                  time,
                );

                return quote(
                  symbol,
                );
              },
          });

        await Promise.all([
          lookup("AAPL"),
          lookup("NVDA"),
          lookup("TSLA"),
        ]);

        expect(
          starts,
        ).toEqual([
          0,
          250,
          500,
        ]);
      },
    );

    it(
      "continues processing after one request fails",
      async () => {
        let time = 0;

        const calls:
          string[] = [];

        const lookup =
          createPacedRobinhoodPriceLookup({
            minIntervalMs: 250,

            nowMs:
              () => time,

            sleep:
              async (
                milliseconds,
              ) => {
                time +=
                  milliseconds;
              },

            fetchPrice:
              async (symbol) => {
                calls.push(
                  symbol,
                );

                if (
                  symbol === "AMD"
                ) {
                  throw new Error(
                    "HTTP 429",
                  );
                }

                return quote(
                  symbol,
                );
              },
          });

        const first =
          lookup("AMD");

        const second =
          lookup("NVDA");

        await expect(
          first,
        ).rejects.toThrow(
          "HTTP 429",
        );

        await expect(
          second,
        ).resolves.toMatchObject({
          tokenSymbol:
            "NVDA",
        });

        expect(
          calls,
        ).toEqual([
          "AMD",
          "NVDA",
        ]);
      },
    );
  },
);
