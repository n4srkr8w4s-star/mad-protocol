import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  createMADApi,
} from "../src/api/server.js";

import type {
  evaluateRobinhoodCompositeState,
} from "../src/engine/evaluateRobinhoodCompositeState.js";

const REGISTRY =
  "0x65605F7169ec0dA7aEF8178A8b7d69159b43B222";

const TPONS =
  "0x9B35982C720e18d84cC9D84C6c20FA9cc45b8d36";

const AAPL =
  "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9";

const AAPL_FEED =
  "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0";

type CompositeResult =
  Awaited<
    ReturnType<
      typeof evaluateRobinhoodCompositeState
    >
  >;

afterEach(() => {
  delete process.env.MAD_REGISTRY;
  delete process.env.ROBINHOOD_TESTNET_RPC;
});

describe("MAD API", () => {
  it("reports service health", async () => {
    const app = createMADApi({
      logger: false,
    });

    const response =
      await app.inject({
        method: "GET",
        url: "/health",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    expect(
      response.json(),
    ).toEqual({
      service: "MAD API",
      status: "ok",
    });

    await app.close();
  });

  it("lists monitored assets", async () => {
    const app = createMADApi({
      logger: false,
    });

    const response =
      await app.inject({
        method: "GET",
        url: "/api/v1/assets",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    const body =
      response.json();

    expect(
      body.assets,
    ).toHaveLength(2);

    expect(
      body.assets,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tpons",
          symbol: "tPONS",
          type: "TEST_ASSET",
          chainId: 46630,
          address: TPONS,
        }),

        expect.objectContaining({
          id: "aapl",
          symbol: "AAPL",
          type:
            "ROBINHOOD_STOCK_TOKEN",
          chainId: 4663,
          address: AAPL,
        }),
      ]),
    );

    await app.close();
  });

  it("returns 404 for an unknown asset", async () => {
    const app = createMADApi({
      logger: false,

      resolveRobinhoodCapability:
        async () => undefined,
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/unknown/state",
      });

    expect(
      response.statusCode,
    ).toBe(404);

    expect(
      response.json(),
    ).toEqual({
      error:
        "MAD_ASSET_NOT_FOUND",

      message:
        "The requested asset is not monitored by MAD.",
    });

    await app.close();
  });

  it("returns the registry-backed tPONS state", async () => {
    process.env.MAD_REGISTRY =
      REGISTRY;

    process.env.ROBINHOOD_TESTNET_RPC =
      "https://example.invalid";

    const app = createMADApi({
      logger: false,

      readSnapshot:
        async () => ({
          asset: {
            address: TPONS,
            supported: true,
          },

          mad: {
            score: 0,
            severityCode: 0,
            severity: "NORMAL",
            isDisordered: false,
            disorderBitmap: "0",
            activeDisorders: [],
            sequence: "2",
          },

          provenance: {
            evidenceHash:
              "0x00b878b730a95559fa4554cac0a3a428cf9a9286f0489a2f34c70bfa1b376e95",

            rulesetHash:
              "0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69",

            updatedAtUnix:
              "1788487226",

            updatedAtIso:
              "2026-09-04T02:00:26.000Z",
          },

          network: {
            name:
              "Robinhood Chain Testnet",

            chainId: 46630,
            registry: REGISTRY,
          },
        }),
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/tpons/state",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    const body =
      response.json();

    expect(
      body.asset,
    ).toMatchObject({
      id: "tpons",
      symbol: "tPONS",
      type: "TEST_ASSET",
      address: TPONS,
      chainId: 46630,
    });

    expect(
      body.mad,
    ).toMatchObject({
      score: 0,
      severity: "NORMAL",
      isDisordered: false,
      disorderBitmap: "0",
      sequence: "2",
    });

    await app.close();
  });

  it("returns composite Robinhood state for AAPL", async () => {
    let compositeCalls = 0;

    const composite: CompositeResult = {
      asset: {
        symbol: "AAPL",
        name:
          "Apple • Robinhood Token",

        assetId:
          "0x00000000000000000000000000000000c2425be3658540dd8e2424cbf3c5c649",

        isin:
          "US0378331005",

        status:
          "ASSET_STATUS_ACTIVE",

        contractAddress:
          AAPL,

        chainId: 4663,
      },

      observations: {
        underlying: {
          bid: "327.30",
          ask: "327.34",
          midpointE6:
            "327320000",
          currency: "USD",
          isTradingHalt: false,
          generatedAt:
            "2026-09-04T09:05:53.051564130Z",
        },

        multiplier: {
          robinhoodApi:
            "1.000566080061092436",

          robinhoodApiE18:
            "1000566080061092436",

          onchainE18:
            "1000566080061092436",

          pending: null,
        },

        oracle: {
          feedAddress:
            AAPL_FEED,

          description:
            "Robinhood AAPL / USD",

          price:
            "327.07004308",

          answerRaw:
            "32707004308",

          decimals: 8,

          updatedAt:
            "2026-09-04T06:44:55.000Z",

          heartbeatSeconds:
            86400,

          marketHours:
            "us_equities_24/5",

          marketAvailability:
            "OPEN",

          threshold: 0.5,
        },

        timing: {
          evaluationTimeUnix:
            "1788512758",

          robinhoodPriceGeneratedAtUnix:
            "1788512753",

          oracleUpdatedAtUnix:
            "1788504295",

          robinhoodPriceAgeSeconds:
            5,

          oracleAgeSeconds:
            8463,

          sourceSkewSeconds:
            8458,
        },
      },

      disorders: {
        assessed: [],
        unassessed: [],
      },

      mad: {
        disorderScore: 0,

        severity:
          MADSeverity.NORMAL,

        disorderBitmap: 0n,

        activeDisorders: [],

        assessedDisorders: 4,

        unassessedDisorders: 0,
      },
    };

    const app = createMADApi({
      logger: false,

      resolveRobinhoodCapability:
        async (symbol) => {
          expect(
            symbol.toLowerCase(),
          ).toBe("aapl");

          return {
            symbol: "AAPL",
            name:
              "Apple • Robinhood Token",
            assetId:
              "0x00000000000000000000000000000000c2425be3658540dd8e2424cbf3c5c649",
            capability:
              "FULL",
            supportedDisorders: 4,
            totalDisorders: 4,
          };
        },

      evaluateRobinhoodComposite:
        async (input) => {
          compositeCalls += 1;

          expect(
            input.symbol,
          ).toBe("AAPL");

          return composite;
        },
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/aapl/state",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    expect(
      compositeCalls,
    ).toBe(1);

    const body =
      response.json();

    expect(
      body.asset,
    ).toMatchObject({
      symbol: "AAPL",
      address: AAPL,
      chainId: 4663,
    });

    expect(
      body.mad,
    ).toMatchObject({
      score: 0,
      severityCode: 0,
      severity: "NORMAL",
      isDisordered: false,
      disorderBitmap: "0",
      assessedDisorders: 4,
      unassessedDisorders: 0,
    });

    expect(
      body.observations.oracle,
    ).toMatchObject({
      heartbeatSeconds:
        86400,

      marketAvailability:
        "OPEN",
    });

    await app.close();
  });

  it("returns dynamic state for a FULL Robinhood asset not in the catalog", async () => {
    let compositeCalls = 0;

    const nvdaComposite = {
      asset: {
        symbol: "NVDA",
        name:
          "NVIDIA • Robinhood Token",
        assetId:
          "nvda-robinhood-asset-id",
        isin:
          "US67066G1040",
        status:
          "ASSET_STATUS_ACTIVE",
        contractAddress:
          "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
        chainId: 4663,
      },

      observations:
        {} as CompositeResult["observations"],

      disorders: {
        assessed: [],
        unassessed: [],
      },

      mad: {
        disorderScore: 0,
        severity:
          MADSeverity.NORMAL,
        disorderBitmap: 0n,
        activeDisorders: [],
        assessedDisorders: 4,
        unassessedDisorders: 0,
      },
    } as CompositeResult;

    const app = createMADApi({
      logger: false,

      resolveRobinhoodCapability:
        async (symbol) => {
          expect(
            symbol.toLowerCase(),
          ).toBe("nvda");

          return {
            symbol: "NVDA",
            name:
              "NVIDIA • Robinhood Token",
            assetId:
              "nvda-robinhood-asset-id",
            capability:
              "FULL",
            supportedDisorders: 4,
            totalDisorders: 4,
          };
        },

      evaluateRobinhoodComposite:
        async (input) => {
          compositeCalls += 1;

          expect(
            input.symbol,
          ).toBe("NVDA");

          return nvdaComposite;
        },
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/nvda/state",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    expect(
      compositeCalls,
    ).toBe(1);

    const body =
      response.json();

    expect(
      body.asset,
    ).toMatchObject({
      id: "nvda",
      symbol: "NVDA",
      type:
        "ROBINHOOD_STOCK_TOKEN",
      chainId: 4663,
    });

    expect(
      body.capability,
    ).toEqual({
      level: "FULL",
      supportedDisorders: 4,
      totalDisorders: 4,
    });

    await app.close();
  });

  it("returns explicit capability state for a PARTIAL Robinhood asset", async () => {
    let compositeCalls = 0;

    const app = createMADApi({
      logger: false,

      resolveRobinhoodCapability:
        async (symbol) => {
          expect(
            symbol.toLowerCase(),
          ).toBe("adbe");

          return {
            symbol: "ADBE",
            name:
              "Adobe • Robinhood Token",
            assetId:
              "adbe-robinhood-asset-id",
            capability:
              "PARTIAL",
            supportedDisorders: 2,
            totalDisorders: 4,
          };
        },

      evaluateRobinhoodComposite:
        async () => {
          compositeCalls += 1;

          throw new Error(
            "Composite evaluator must not run for PARTIAL capability.",
          );
        },
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/adbe/state",
      });

    expect(
      response.statusCode,
    ).toBe(422);

    expect(
      compositeCalls,
    ).toBe(0);

    expect(
      response.json(),
    ).toMatchObject({
      error:
        "MAD_ASSET_STATE_UNAVAILABLE",

      asset: {
        id: "adbe",
        symbol: "ADBE",
      },

      capability: {
        level: "PARTIAL",
        supportedDisorders: 2,
        totalDisorders: 4,
      },
    });

    await app.close();
  });

  it("searches the Robinhood asset directory", async () => {
    const queries: string[] = [];

    const app = createMADApi({
      logger: false,

      searchRobinhoodAssets:
        async (query) => {
          queries.push(query);

          return [
            {
              symbol: "TSLA",
              name:
                "Tesla • Robinhood Token",
              isin: "US88160R1014",
              address:
                "0x1111111111111111111111111111111111111111",
              chainId: 4663,
              status: "ACTIVE",
              logoUrl:
                "https://example.com/tsla.png",
              monitoring:
                "DISCOVERABLE",
            },
          ];
        },
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/search?q=tesla",
      });

    expect(response.statusCode).toBe(200);

    expect(queries).toEqual([
      "tesla",
    ]);

    expect(
      response.json(),
    ).toEqual({
      query: "tesla",
      count: 1,
      results: [
        {
          symbol: "TSLA",
          name:
            "Tesla • Robinhood Token",
          isin: "US88160R1014",
          address:
            "0x1111111111111111111111111111111111111111",
          chainId: 4663,
          status: "ACTIVE",
          logoUrl:
            "https://example.com/tsla.png",
          monitoring:
            "DISCOVERABLE",
        },
      ],
    });

    await app.close();
  });

  it("rejects an empty asset search query", async () => {
    let searchCalls = 0;

    const app = createMADApi({
      logger: false,

      searchRobinhoodAssets:
        async () => {
          searchCalls += 1;
          return [];
        },
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/search?q=",
      });

    expect(response.statusCode).toBe(400);

    expect(searchCalls).toBe(0);

    expect(
      response.json(),
    ).toEqual({
      error:
        "MAD_SEARCH_QUERY_REQUIRED",
      message:
        "A non-empty search query is required.",
    });

    await app.close();
  });

});
