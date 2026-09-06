import {
  describe,
  expect,
  it,
} from "vitest";

import {
  fetchRobinhoodPrice,

  RobinhoodHttpError,
  normaliseRobinhoodPrice,
} from "../src/adapters/robinhood/prices.js";

const AAPL_QUOTE = {
  tokenSymbol: "AAPL",

  deployments: [
    {
      contractAddress:
        "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
      chainId: 4663,
      networkName: "Robinhood Chain",
    },
  ],

  bid: "326.85",
  ask: "327.01",
  currency: "USD",

  dailyTradingVolume:
    "37225806",

  isTradingHalt: false,

  generatedAt:
    "2026-09-04T07:27:31.619209103Z",

  dailyHigh: "328.5",
  dailyLow: "326.82",

  mintBurnTokenVolume:
    "2150.94139494",

  mintBurnUsdVolume:
    "703207.2702477342",
};

function createMockFetch(): typeof fetch {
  return (async () => ({
    ok: true,
    status: 200,

    json: async () => ({
      quotes: [AAPL_QUOTE],
    }),
  })) as unknown as typeof fetch;
}

describe(
  "Robinhood Stock Token price adapter",
  () => {
    it("fetches the AAPL underlying quote", async () => {
      const quote =
        await fetchRobinhoodPrice(
          "aapl",
          createMockFetch(),
        );

      expect(quote).toMatchObject({
        tokenSymbol: "AAPL",
        bid: "326.85",
        ask: "327.01",
        currency: "USD",
        isTradingHalt: false,
      });
    });

    it("exposes structured upstream HTTP failure evidence", async () => {
      const fetchFn =
        (async () => ({
          ok: false,
          status: 429,

          text:
            async () =>
              "local_rate_limited",
        })) as unknown as typeof fetch;

      let captured:
        unknown;

      try {
        await fetchRobinhoodPrice(
          "aapl",
          fetchFn,
        );
      } catch (error) {
        captured = error;
      }

      expect(
        captured,
      ).toBeInstanceOf(
        RobinhoodHttpError,
      );

      const error =
        captured as RobinhoodHttpError;

      expect(
        error.message,
      ).toBe(
        "Robinhood price request failed: HTTP 429",
      );

      expect(
        error.status,
      ).toBe(429);

      expect(
        error.endpoint,
      ).toBe(
        "https://api.robinhood.com/rhj/prices/AAPL",
      );

      expect(
        error.responseBody,
      ).toBe(
        "local_rate_limited",
      );
    });

    it("normalises prices without floating point", () => {
      const price =
        normaliseRobinhoodPrice(
          AAPL_QUOTE,
        );

      expect(price.bidE6).toBe(
        326850000n,
      );

      expect(price.askE6).toBe(
        327010000n,
      );

      expect(price.midpointE6).toBe(
        326930000n,
      );

      expect(price.spreadE6).toBe(
        160000n,
      );
    });

    it("preserves halt and provenance state", () => {
      const price =
        normaliseRobinhoodPrice(
          AAPL_QUOTE,
        );

      expect(
        price.isTradingHalt,
      ).toBe(false);

      expect(price.generatedAt).toBe(
        "2026-09-04T07:27:31.619209103Z",
      );

      expect(
        price.dailyTradingVolume,
      ).toBe("37225806");
    });

    it("rejects an inverted market", () => {
      expect(() =>
        normaliseRobinhoodPrice({
          ...AAPL_QUOTE,
          bid: "327.50",
          ask: "327.00",
        }),
      ).toThrow(
        "Robinhood ask must not be below bid",
      );
    });
  },
);
