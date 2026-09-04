import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ActiveDisorderId,
  MADSeverity,
} from "../src/domain/types.js";

import {
  evaluateRobinhoodCompositeState,
} from "../src/engine/evaluateRobinhoodCompositeState.js";

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

  bid: "326.95",
  ask: "327.45",
  currency: "USD",

  dailyTradingVolume:
    "37225806",

  isTradingHalt: false,

  generatedAt:
    "2026-09-04T08:02:50.667065013Z",

  dailyHigh: "328.5",
  dailyLow: "326.82",

  mintBurnTokenVolume:
    "2150.94139494",

  mintBurnUsdVolume:
    "703207.2702477342",
};

const AAPL_MULTIPLIER = {
  contractAddress:
    "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",

  valueE18:
    1000566080061092436n,

  valueE18String:
    "1000566080061092436",
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
  "Robinhood composite MAD state",
  () => {
    it("produces a coherent composite AAPL assessment", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",

            feedAddress:
              AAPL_ORACLE.feedAddress,

            rpcUrl:
              "https://example.invalid",

            evaluationTimeUnix:
              1788509000n,
          },

          {
            getAsset:
              async () => AAPL,

            getPrice:
              async () => AAPL_PRICE,

            readMultiplier:
              async () =>
                AAPL_MULTIPLIER,

            readOracle:
              async () =>
                AAPL_ORACLE,
          },
        );

      expect(
        result.asset.symbol,
      ).toBe("AAPL");

      expect(
        result.mad.disorderScore,
      ).toBe(0);

      expect(
        result.mad.severity,
      ).toBe(
        MADSeverity.NORMAL,
      );

      expect(
        result.mad.disorderBitmap,
      ).toBe(0n);

      expect(
        result.mad.activeDisorders,
      ).toEqual([]);

      expect(
        result.mad.assessedDisorders,
      ).toBe(2);

      expect(
        result.mad.unassessedDisorders,
      ).toBe(2);
    });

    it("keeps unassessed disorders explicitly separate from NORMAL assessments", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",

            feedAddress:
              AAPL_ORACLE.feedAddress,

            rpcUrl:
              "https://example.invalid",

            evaluationTimeUnix:
              1788509000n,
          },

          {
            getAsset:
              async () => AAPL,

            getPrice:
              async () => AAPL_PRICE,

            readMultiplier:
              async () =>
                AAPL_MULTIPLIER,

            readOracle:
              async () =>
                AAPL_ORACLE,
          },
        );

      expect(
        result.disorders.assessed.map(
          (item) => item.id,
        ),
      ).toEqual([
        ActiveDisorderId.MULTIPLIER_TRANSITION,
        ActiveDisorderId.ORACLE_DEVIATION,
      ]);

      expect(
        result.disorders.unassessed.map(
          (item) => item.id,
        ),
      ).toEqual([
        ActiveDisorderId.UNDERLYING_TRADING_HALT,
        ActiveDisorderId.REFERENCE_DATA_STALE,
      ]);

      expect(
        result.observations.timing
          .robinhoodPriceAgeSeconds,
      ).toBe(30);

      expect(
        result.observations.timing
          .oracleAgeSeconds,
      ).toBe(4705);

      expect(
        result.observations.timing
          .sourceSkewSeconds,
      ).toBe(4675);
    });

    it("fetches each external source exactly once per evaluation cycle", async () => {
      let assetCalls = 0;
      let priceCalls = 0;
      let multiplierCalls = 0;
      let oracleCalls = 0;

      await evaluateRobinhoodCompositeState(
        {
          symbol: "AAPL",

          feedAddress:
            AAPL_ORACLE.feedAddress,

          rpcUrl:
            "https://example.invalid",

          evaluationTimeUnix:
            1788509000n,
        },

        {
          getAsset: async () => {
            assetCalls += 1;
            return AAPL;
          },

          getPrice: async () => {
            priceCalls += 1;
            return AAPL_PRICE;
          },

          readMultiplier: async () => {
            multiplierCalls += 1;
            return AAPL_MULTIPLIER;
          },

          readOracle: async () => {
            oracleCalls += 1;
            return AAPL_ORACLE;
          },
        },
      );

      expect(assetCalls).toBe(1);
      expect(priceCalls).toBe(1);
      expect(multiplierCalls).toBe(1);
      expect(oracleCalls).toBe(1);
    });

    it("aggregates simultaneous Robinhood disorders deterministically", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",

            feedAddress:
              AAPL_ORACLE.feedAddress,

            rpcUrl:
              "https://example.invalid",

            evaluationTimeUnix:
              1788509000n,
          },

          {
            getAsset:
              async () => ({
                ...AAPL,

                pendingMultiplier:
                  "0.500000000000000000",
              }),

            getPrice:
              async () => AAPL_PRICE,

            readMultiplier:
              async () =>
                AAPL_MULTIPLIER,

            readOracle:
              async () => ({
                ...AAPL_ORACLE,

                answer:
                  33100000000n,

                answerRaw:
                  "33100000000",

                price:
                  "331.0",
              }),
          },
        );

      expect(
        result.mad.disorderScore,
      ).toBe(80);

      expect(
        result.mad.severity,
      ).toBe(
        MADSeverity.CRITICAL,
      );

      expect(
        result.mad.disorderBitmap,
      ).toBe(
        (1n <<
          BigInt(
            ActiveDisorderId.MULTIPLIER_TRANSITION,
          )) |
          (1n <<
            BigInt(
              ActiveDisorderId.ORACLE_DEVIATION,
            )),
      );

      expect(
        result.mad.activeDisorders.map(
          (item) => item.disorderId,
        ),
      ).toEqual([
        ActiveDisorderId.MULTIPLIER_TRANSITION,
        ActiveDisorderId.ORACLE_DEVIATION,
      ]);
    });
  },
);
