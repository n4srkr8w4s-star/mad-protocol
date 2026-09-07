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

import {
  buildEvidenceDNA,
} from "../src/engine/buildEvidenceDNA.js";

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

  dailyTradingVolume: "37225806",

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

const AAPL_FEED_METADATA = {
  name:
    "Robinhood AAPL / USD",

  proxyAddress:
    "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0",

  contractAddress:
    "0xBb11A21267cFDb63d4935d99a499133DD1744ACb",

  secondaryProxyAddress:
    "0x4bDbb3150014c6Ab2C6D9347B0779c49015a2f3f",

  heartbeatSeconds: 86400,
  threshold: 0.5,
  decimals: 8,

  assetClass: "Equity",
  assetSubClass: "US",
  baseAsset: "AAPL",
  quoteAsset: "USD",
  marketHours: "us_equities_24/5",
  productType: "Price",
  productTypeCode:
    "primaryTokenizedPrice",
};

function baseDependencies() {
  return {
    getAsset:
      async () => AAPL,

    getPrice:
      async () => AAPL_PRICE,

    readMultiplier:
      async () => AAPL_MULTIPLIER,

    readOracle:
      async () => AAPL_ORACLE,

    resolveFeedMetadata:
      async () => AAPL_FEED_METADATA,
  };
}

describe(
  "Robinhood composite MAD state",
  () => {
    it("produces a fully assessed coherent AAPL state", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",

            rpcUrl:
              "https://example.invalid",

            evaluationTimeUnix:
              1788509000n,
          },

          baseDependencies(),
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
      ).toBe(4);

      expect(
        result.mad.unassessedDisorders,
      ).toBe(0);

      expect(
        result.disorders.unassessed,
      ).toEqual([]);
    });

    it("assesses all four Robinhood disorders explicitly", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",

            rpcUrl:
              "https://example.invalid",

            evaluationTimeUnix:
              1788509000n,
          },

          baseDependencies(),
        );

      expect(
        result.disorders.assessed.map(
          (item) => item.id,
        ),
      ).toEqual([
        ActiveDisorderId.UNDERLYING_TRADING_HALT,
        ActiveDisorderId.MULTIPLIER_TRANSITION,
        ActiveDisorderId.REFERENCE_DATA_STALE,
        ActiveDisorderId.ORACLE_DEVIATION,
      ]);

      const freshness =
        result.disorders.assessed.find(
          (item) =>
            item.id ===
            ActiveDisorderId.REFERENCE_DATA_STALE,
        );

      expect(
        freshness?.evaluation.active,
      ).toBe(false);

      expect(
        freshness?.evaluation.score,
      ).toBe(0);

      expect(
        result.observations.oracle
          .heartbeatSeconds,
      ).toBe(86400);

      expect(
        result.observations.oracle
          .marketHours,
      ).toBe(
        "us_equities_24/5",
      );

      expect(
        result.observations.oracle
          .marketAvailability,
      ).toBe("OPEN");
    });

    it("fetches every external source exactly once per cycle", async () => {
      let assetCalls = 0;
      let priceCalls = 0;
      let multiplierCalls = 0;
      let oracleCalls = 0;
      let feedMetadataCalls = 0;

      await evaluateRobinhoodCompositeState(
        {
          symbol: "AAPL",

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

          resolveFeedMetadata: async () => {
            feedMetadataCalls += 1;
            return AAPL_FEED_METADATA;
          },
        },
      );

      expect(assetCalls).toBe(1);
      expect(priceCalls).toBe(1);
      expect(multiplierCalls).toBe(1);
      expect(oracleCalls).toBe(1);
      expect(feedMetadataCalls).toBe(1);
    });

    it("aggregates simultaneous disorders deterministically", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",

            rpcUrl:
              "https://example.invalid",

            evaluationTimeUnix:
              1788509000n,
          },

          {
            ...baseDependencies(),

            getAsset:
              async () => ({
                ...AAPL,

                pendingMultiplier:
                  "0.500000000000000000",
              }),

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

    it("does not assess oracle deviation when the reference market is closed", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",
            rpcUrl:
              "https://example.invalid",
            evaluationTimeUnix:
              1788609600n,
          },
          baseDependencies(),
        );

      expect(
        result.mad.disorderScore,
      ).toBe(0);

      expect(
        result.mad.disorderBitmap,
      ).toBe(0n);

      expect(
        result.mad.assessedDisorders,
      ).toBe(3);

      expect(
        result.mad.unassessedDisorders,
      ).toBe(1);

      expect(
        result.disorders.unassessed,
      ).toEqual([
        expect.objectContaining({
          id:
            ActiveDisorderId.ORACLE_DEVIATION,
          code:
            "ORACLE_DEVIATION",
        }),
      ]);

      expect(
        result.disorders.assessed.some(
          (item) =>
            item.id ===
            ActiveDisorderId.ORACLE_DEVIATION,
        ),
      ).toBe(false);
    });


    it("builds deterministic Evidence DNA for a normal state", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",
            rpcUrl:
              "https://example.invalid",
            evaluationTimeUnix:
              1788509000n,
          },
          baseDependencies(),
        );

      const dna =
        buildEvidenceDNA(result);

      expect(dna.asset.symbol).toBe("AAPL");
      expect(dna.mad.score).toBe(0);
      expect(
        dna.mad.dominantDisorders,
      ).toEqual([]);

      expect(
        dna.disorders.every(
          (disorder) =>
            disorder.status ===
            "INACTIVE",
        ),
      ).toBe(true);
    });

    it("extracts deterministic rule evidence", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",
            rpcUrl:
              "https://example.invalid",
            evaluationTimeUnix:
              1788509000n,
          },
          baseDependencies(),
        );

      const dna =
        buildEvidenceDNA(result);

      const multiplier =
        dna.disorders.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.MULTIPLIER_TRANSITION,
        );

      expect(
        multiplier?.evidence.map(
          (fact) => fact.key,
        ),
      ).toEqual([
        "currentMultiplierMatches",
        "transitionPending",
        "expectedCurrentE18",
        "observedOnchainE18",
        "pendingE18",
      ]);

      const oracle =
        dna.disorders.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.ORACLE_DEVIATION,
        );

      expect(
        oracle?.evidence.map(
          (fact) => fact.key,
        ),
      ).toEqual([
        "expectedPriceE18",
        "observedPriceE18",
        "deviationBps",
        "direction",
      ]);
    });

    it("marks the score-setting disorder as DOMINANT", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",
            rpcUrl:
              "https://example.invalid",
            evaluationTimeUnix:
              1788509000n,
          },
          baseDependencies(),
        );

      const halt =
        result.disorders.assessed.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
        );

      if (!halt) {
        throw new Error(
          "Trading-halt evaluation missing",
        );
      }

      halt.evaluation.active = true;
      halt.evaluation.score = 80;
      halt.evaluation.severity =
        MADSeverity.CRITICAL;

      result.mad.disorderScore = 80;
      result.mad.severity =
        MADSeverity.CRITICAL;
      result.mad.activeDisorders = [
        {
          disorderId:
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
          score: 80,
          severity:
            MADSeverity.CRITICAL,
        },
      ];

      const dna =
        buildEvidenceDNA(result);

      expect(
        dna.mad.dominantDisorders,
      ).toEqual([
        ActiveDisorderId.UNDERLYING_TRADING_HALT,
      ]);

      expect(
        dna.disorders.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
        )?.status,
      ).toBe("DOMINANT");
    });


    it("marks lower-scoring active disorders as ACTIVE", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",
            rpcUrl:
              "https://example.invalid",
            evaluationTimeUnix:
              1788509000n,
          },
          baseDependencies(),
        );

      const halt =
        result.disorders.assessed.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
        );

      const multiplier =
        result.disorders.assessed.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.MULTIPLIER_TRANSITION,
        );

      if (!halt || !multiplier) {
        throw new Error(
          "Expected assessed disorders missing",
        );
      }

      halt.evaluation.active = true;
      halt.evaluation.score = 80;
      halt.evaluation.severity =
        MADSeverity.CRITICAL;

      multiplier.evaluation.active = true;
      multiplier.evaluation.score = 40;
      multiplier.evaluation.severity =
        MADSeverity.WATCH;

      result.mad.disorderScore = 80;
      result.mad.severity =
        MADSeverity.CRITICAL;

      result.mad.activeDisorders = [
        {
          disorderId:
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
          score: 80,
          severity:
            MADSeverity.CRITICAL,
        },
        {
          disorderId:
            ActiveDisorderId.MULTIPLIER_TRANSITION,
          score: 40,
          severity:
            MADSeverity.WATCH,
        },
      ];

      const dna =
        buildEvidenceDNA(result);

      expect(
        dna.disorders.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
        )?.status,
      ).toBe("DOMINANT");

      expect(
        dna.disorders.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.MULTIPLIER_TRANSITION,
        )?.status,
      ).toBe("ACTIVE");
    });

    it("allows multiple tied disorders to be DOMINANT", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",
            rpcUrl:
              "https://example.invalid",
            evaluationTimeUnix:
              1788509000n,
          },
          baseDependencies(),
        );

      const halt =
        result.disorders.assessed.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
        );

      const oracle =
        result.disorders.assessed.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.ORACLE_DEVIATION,
        );

      if (!halt || !oracle) {
        throw new Error(
          "Expected assessed disorders missing",
        );
      }

      halt.evaluation.active = true;
      halt.evaluation.score = 80;
      halt.evaluation.severity =
        MADSeverity.CRITICAL;

      oracle.evaluation.active = true;
      oracle.evaluation.score = 80;
      oracle.evaluation.severity =
        MADSeverity.CRITICAL;

      result.mad.disorderScore = 80;
      result.mad.severity =
        MADSeverity.CRITICAL;

      result.mad.activeDisorders = [
        {
          disorderId:
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
          score: 80,
          severity:
            MADSeverity.CRITICAL,
        },
        {
          disorderId:
            ActiveDisorderId.ORACLE_DEVIATION,
          score: 80,
          severity:
            MADSeverity.CRITICAL,
        },
      ];

      const dna =
        buildEvidenceDNA(result);

      expect(
        dna.mad.dominantDisorders,
      ).toEqual([
        ActiveDisorderId.UNDERLYING_TRADING_HALT,
        ActiveDisorderId.ORACLE_DEVIATION,
      ]);

      expect(
        dna.disorders
          .filter(
            (disorder) =>
              disorder.status ===
              "DOMINANT",
          )
          .map(
            (disorder) =>
              disorder.id,
          ),
      ).toEqual([
        ActiveDisorderId.UNDERLYING_TRADING_HALT,
        ActiveDisorderId.ORACLE_DEVIATION,
      ]);
    });

    it("preserves unassessed Evidence DNA without inventing evidence", async () => {
      const result =
        await evaluateRobinhoodCompositeState(
          {
            symbol: "AAPL",
            rpcUrl:
              "https://example.invalid",
            evaluationTimeUnix:
              1788609600n,
          },
          baseDependencies(),
        );

      const dna =
        buildEvidenceDNA(result);

      const oracle =
        dna.disorders.find(
          (disorder) =>
            disorder.id ===
            ActiveDisorderId.ORACLE_DEVIATION,
        );

      expect(
        oracle?.status,
      ).toBe("UNASSESSED");

      expect(
        oracle?.score,
      ).toBeNull();

      expect(
        oracle?.severity,
      ).toBeNull();

      expect(
        oracle?.evidence,
      ).toEqual([]);

      expect(
        typeof oracle?.reason,
      ).toBe("string");

      expect(
        oracle?.reason.length,
      ).toBeGreaterThan(0);
    });

  },
);
