import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  evaluateRobinhoodPriceCoherence,
} from "../src/engine/evaluateRobinhoodPriceCoherence.js";

const AAPL = {
  id: "0x00000000000000000000000000000000c2425be3658540dd8e2424cbf3c5c649",
  tokenSymbol: "AAPL",
  tokenName: "Apple • Robinhood Token",

  deployments: [
    {
      contractAddress:
        "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
      chainId: 4663,
      networkName: "Robinhood Chain",
    },
  ],

  currentMultiplier:
    "1.000566080061092436",

  pendingMultiplier: "",

  status: "ASSET_STATUS_ACTIVE",

  logoUrl:
    "https://cdn.robinhood.com/ncw_assets/logos/aapl.png",

  tradingCapabilities: {
    market: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },

    extended: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },

    overnight: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },
  },

  tokenDecimals: 18,
  isin: "US0378331005",
};

const AAPL_PRICE = {
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

const AAPL_ORACLE = {
  feedAddress:
    "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0",

  description:
    "Robinhood AAPL / USD",

  decimals: 8,

  roundId:
    "18446744073709552171",

  answer:
    32707004308n,

  answerRaw:
    "32707004308",

  price:
    "327.07004308",

  startedAtUnix:
    "1788504283",

  updatedAtUnix:
    "1788504295",

  startedAtIso:
    "2026-09-04T06:44:43.000Z",

  updatedAtIso:
    "2026-09-04T06:44:55.000Z",

  answeredInRound:
    "18446744073709552171",
};

describe(
  "Robinhood price coherence evaluation",
  () => {
    it("evaluates the observed AAPL state as coherent", async () => {
      const result =
        await evaluateRobinhoodPriceCoherence(
          {
            symbol: "AAPL",
            feedAddress:
              AAPL_ORACLE.feedAddress,
            rpcUrl:
              "https://example.invalid",
          },
          {
            getAsset:
              async () => AAPL,

            getPrice:
              async () => AAPL_PRICE,

            readOracle:
              async () => AAPL_ORACLE,
          },
        );

      expect(
        result.asset.symbol,
      ).toBe("AAPL");

      expect(
        result.sources.robinhoodPrice
          .midpointE6,
      ).toBe("326930000");

      expect(
        result.sources.robinhoodAsset
          .currentMultiplierE18,
      ).toBe(
        "1000566080061092436",
      );

      expect(
        result.sources.robinhoodOracle
          .price,
      ).toBe("327.07004308");

      expect(
        result.evaluation.active,
      ).toBe(false);

      expect(
        result.evaluation.score,
      ).toBe(0);

      expect(
        result.evaluation.severity,
      ).toBe(
        MADSeverity.NORMAL,
      );
    });

    it("rejects inconsistent Robinhood deployment identity", async () => {
      await expect(
        evaluateRobinhoodPriceCoherence(
          {
            symbol: "AAPL",
            feedAddress:
              AAPL_ORACLE.feedAddress,
            rpcUrl:
              "https://example.invalid",
          },
          {
            getAsset:
              async () => AAPL,

            getPrice:
              async () => ({
                ...AAPL_PRICE,

                deployments: [
                  {
                    contractAddress:
                      "0x0000000000000000000000000000000000000001",
                    chainId: 4663,
                    networkName:
                      "Robinhood Chain",
                  },
                ],
              }),

            readOracle:
              async () => AAPL_ORACLE,
          },
        ),
      ).rejects.toThrow(
        "deployment mismatch between Robinhood assets and prices",
      );
    });

    it("raises AD-007 when the oracle materially diverges", async () => {
      const result =
        await evaluateRobinhoodPriceCoherence(
          {
            symbol: "AAPL",
            feedAddress:
              AAPL_ORACLE.feedAddress,
            rpcUrl:
              "https://example.invalid",
          },
          {
            getAsset:
              async () => AAPL,

            getPrice:
              async () => AAPL_PRICE,

            readOracle:
              async () => ({
                ...AAPL_ORACLE,

                answer:
                  33050000000n,

                answerRaw:
                  "33050000000",

                price:
                  "330.5",
              }),
          },
        );

      expect(
        result.evaluation.active,
      ).toBe(true);

      expect(
        result.evaluation.score,
      ).toBeGreaterThanOrEqual(80);

      expect(
        result.evaluation.severity,
      ).toBe(
        MADSeverity.CRITICAL,
      );
    });
  },
);
