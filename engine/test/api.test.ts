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

function radarSnapshotWithTransition(
  transition: unknown,
) {
  return {
    generatedAt:
      "2026-09-07T01:00:00.000Z",

    counts: {
      discovered: 1,
      full: 1,
      partial: 0,
      discoverable: 0,
      assessed: 1,
      capabilityOnly: 0,
      errors: 0,
      disordered: 0,
      normal: 1,
    },

    sourceHealth: {},

    assets: [
      {
        symbol: "NVDA",
        name:
          "NVIDIA • Robinhood Token",
        assetId:
          "nvda-asset-id",
        isin:
          "US67066G1040",
        address:
          "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
        chainId: 4663,
        capability: "FULL",
        supportedDisorders: 4,
        totalDisorders: 4,
        feedResolution:
          "RESOLVED",
        stateStatus:
          "ASSESSED",
        state: {
          score: 0,
          severityCode: 0,
          severity: "NORMAL",
          assessedDisorders: 4,
          unassessedDisorders: 0,
          marketAvailability:
            "OPEN",
          activeDisorders: [],
        },
        transition,
        reason: null,
      },
    ],
  } as any;
}

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

  it("returns the cached MAD Radar snapshot contract", async () => {
    let calls = 0;

    const app = createMADApi({
      logger: false,

      getRadarSnapshot:
        async (input) => {
          calls += 1;

          expect(
            input.rpcUrl,
          ).toBe(
            "https://rpc.mainnet.chain.robinhood.com",
          );

          expect(
            input.concurrency,
          ).toBe(4);

          return {
            generatedAt:
              "2026-09-06T02:00:00.000Z",

            counts: {
              discovered: 2,
              full: 1,
              partial: 1,
              discoverable: 0,
              assessed: 1,
              capabilityOnly: 1,
              errors: 0,
              disordered: 0,
              normal: 1,
            },

            assets: [
              {
                symbol: "NVDA",
                name:
                  "NVIDIA • Robinhood Token",
                assetId:
                  "nvda-asset-id",
                isin:
                  "US67066G1040",
                address:
                  "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
                chainId: 4663,
                capability: "FULL",
                supportedDisorders: 4,
                totalDisorders: 4,
                feedResolution:
                  "RESOLVED",
                stateStatus:
                  "ASSESSED",
                state: {
                  score: 0,
                  severityCode: 0,
                  severity:
                    "NORMAL",
                  assessedDisorders: 3,
                  unassessedDisorders: 1,
                  marketAvailability:
                    "CLOSED",
                  activeDisorders: [],
                },
                reason: null,
              },

              {
                symbol: "ADBE",
                name:
                  "Adobe • Robinhood Token",
                assetId:
                  "adbe-asset-id",
                isin:
                  "US00724F1012",
                address:
                  "0x232B8ed6377BE97813853B0Ac104c4Cda8378d1B",
                chainId: 4663,
                capability:
                  "PARTIAL",
                supportedDisorders: 2,
                totalDisorders: 4,
                feedResolution:
                  "MISSING",
                stateStatus:
                  "CAPABILITY_ONLY",
                state: null,
                reason:
                  "MAD has partial structural capability for this asset.",
              },
            ],
          };
        },
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/radar",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    expect(
      calls,
    ).toBe(1);

    expect(
      response.json(),
    ).toMatchObject({
      counts: {
        discovered: 2,
        full: 1,
        partial: 1,
        assessed: 1,
        capabilityOnly: 1,
        errors: 0,
      },

      assets: [
        {
          symbol: "NVDA",
          capability: "FULL",
          stateStatus:
            "ASSESSED",
        },

        {
          symbol: "ADBE",
          capability:
            "PARTIAL",
          stateStatus:
            "CAPABILITY_ONLY",
        },
      ],
    });

    await app.close();
  });

  it("presents an established Radar baseline without claiming no change", async () => {
    const app = createMADApi({
      logger: false,

      getRadarSnapshot:
        async () =>
          radarSnapshotWithTransition({
            status:
              "BASELINE_ESTABLISHED",
            asset: {
              symbol: "NVDA",
              assetId:
                "nvda-asset-id",
            },
            diff: null,
          }),
    });

    const response =
      await app.inject({
        method: "GET",
        url: "/api/v1/radar",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    expect(
      response.json()
        .assets[0]
        .transition,
    ).toEqual({
      status:
        "BASELINE_ESTABLISHED",
      changed: null,
      changeTypes: [],
      scoreDelta: null,
      severity: {
        previous: null,
        current: null,
        changed: false,
      },
      disorders: {
        activated: [],
        cleared: [],
      },
    });

    await app.close();
  });

  it("presents an available Radar diff with no semantic change", async () => {
    const app = createMADApi({
      logger: false,

      getRadarSnapshot:
        async () =>
          radarSnapshotWithTransition({
            status:
              "DIFF_AVAILABLE",
            asset: {
              symbol: "NVDA",
              assetId:
                "nvda-asset-id",
            },
            diff: {
              changed: false,
              changeTypes: [],
              score: {
                delta: 0,
              },
              severity: {
                previous: 0,
                current: 0,
                changed: false,
              },
              disorders: {
                activated: [],
                cleared: [],
              },
            },
          }),
    });

    const response =
      await app.inject({
        method: "GET",
        url: "/api/v1/radar",
      });

    expect(
      response.json()
        .assets[0]
        .transition,
    ).toEqual({
      status:
        "DIFF_AVAILABLE",
      changed: false,
      changeTypes: [],
      scoreDelta: 0,
      severity: {
        previous: 0,
        current: 0,
        changed: false,
      },
      disorders: {
        activated: [],
        cleared: [],
      },
    });

    await app.close();
  });

  it("presents meaningful Radar State Diff semantics", async () => {
    const app = createMADApi({
      logger: false,

      getRadarSnapshot:
        async () =>
          radarSnapshotWithTransition({
            status:
              "DIFF_AVAILABLE",
            asset: {
              symbol: "NVDA",
              assetId:
                "nvda-asset-id",
            },
            diff: {
              changed: true,

              changeTypes: [
                "SCORE_CHANGED",
                "SEVERITY_CHANGED",
                "DISORDER_ACTIVATED",
              ],

              score: {
                delta: 50,
              },

              severity: {
                previous: 0,
                current: 2,
                changed: true,
              },

              disorders: {
                activated: [1],
                cleared: [],
              },
            },
          }),
    });

    const response =
      await app.inject({
        method: "GET",
        url: "/api/v1/radar",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    expect(
      response.json()
        .assets[0]
        .transition,
    ).toEqual({
      status:
        "DIFF_AVAILABLE",
      changed: true,

      changeTypes: [
        "SCORE_CHANGED",
        "SEVERITY_CHANGED",
        "DISORDER_ACTIVATED",
      ],

      scoreDelta: 50,

      severity: {
        previous: 0,
        current: 2,
        changed: true,
      },

      disorders: {
        activated: [1],
        cleared: [],
      },
    });

    await app.close();
  });

  it("lists MAD-specific assets and the dynamic Robinhood universe", async () => {
    const app = createMADApi({
      logger: false,

      scanRobinhoodUniverse:
        async () => ({
          generatedAt:
            "2026-09-05T10:34:22.608Z",

          counts: {
            discovered: 2,
            full: 1,
            partial: 1,
            discoverable: 0,
            ambiguousFeeds: 0,
          },

          assets: [
            {
              feedResolution:
                "RESOLVED",

              capability: {
                symbol: "NVDA",

                name:
                  "NVIDIA • Robinhood Token",

                assetId:
                  "nvda-robinhood-asset-id",

                isin:
                  "US67066G1040",

                status:
                  "ASSET_STATUS_ACTIVE",

                deployment: {
                  address:
                    "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
                  chainId: 4663,
                },

                feed: {
                  proxyAddress:
                    "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15",
                  heartbeatSeconds:
                    86400,
                  marketHours:
                    "us_equities_24/5",
                  productTypeCode:
                    "primaryTokenizedPrice",
                },

                capability:
                  "FULL",

                supportedDisorders:
                  4,

                totalDisorders:
                  4,

                disorders: [],
              },
            },

            {
              feedResolution:
                "MISSING",

              capability: {
                symbol: "ADBE",

                name:
                  "Adobe • Robinhood Token",

                assetId:
                  "adbe-robinhood-asset-id",

                isin:
                  "US00724F1012",

                status:
                  "ASSET_STATUS_ACTIVE",

                deployment: {
                  address:
                    "0x232B8ed6377BE97813853B0Ac104c4Cda8378d1B",
                  chainId: 4663,
                },

                feed: null,

                capability:
                  "PARTIAL",

                supportedDisorders:
                  2,

                totalDisorders:
                  4,

                disorders: [],
              },
            },
          ],
        }),
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
      body.counts,
    ).toEqual({
      total: 3,
      madSpecific: 1,

      robinhood: {
        discovered: 2,
        full: 1,
        partial: 1,
        discoverable: 0,
        ambiguousFeeds: 0,
      },
    });

    expect(
      body.assets,
    ).toHaveLength(3);

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
          id: "nvda",
          symbol: "NVDA",
          type:
            "ROBINHOOD_STOCK_TOKEN",
          monitoring: "FULL",
          supportedDisorders: 4,
          totalDisorders: 4,
          feedResolution:
            "RESOLVED",
        }),

        expect.objectContaining({
          id: "adbe",
          symbol: "ADBE",
          type:
            "ROBINHOOD_STOCK_TOKEN",
          monitoring: "PARTIAL",
          supportedDisorders: 2,
          totalDisorders: 4,
          feedResolution:
            "MISSING",
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


  it("returns public Evidence DNA for a FULL Robinhood asset", async () => {
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
          "/api/v1/assets/nvda/evidence",
      });

    expect(
      response.statusCode,
    ).toBe(200);

    expect(
      compositeCalls,
    ).toBe(1);

    expect(
      response.json(),
    ).toEqual({
      asset: {
        symbol: "NVDA",
        assetId:
          "nvda-robinhood-asset-id",
      },

      mad: {
        score: 0,
        severityCode:
          MADSeverity.NORMAL,
        severity: "NORMAL",
        dominantDisorders: [],
      },

      disorders: [],
    });

    await app.close();
  });

  it("rejects Evidence DNA for a PARTIAL Robinhood asset", async () => {
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
            "Composite evaluator must not run for PARTIAL Evidence DNA capability.",
          );
        },
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/adbe/evidence",
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
        "MAD_ASSET_EVIDENCE_UNAVAILABLE",

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

  it("returns 404 Evidence DNA for an unknown asset", async () => {
    let compositeCalls = 0;

    const app = createMADApi({
      logger: false,

      resolveRobinhoodCapability:
        async () =>
          undefined,

      evaluateRobinhoodComposite:
        async () => {
          compositeCalls += 1;

          throw new Error(
            "Composite evaluator must not run for an unknown asset.",
          );
        },
    });

    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/assets/not-real/evidence",
      });

    expect(
      response.statusCode,
    ).toBe(404);

    expect(
      compositeCalls,
    ).toBe(0);

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


});
