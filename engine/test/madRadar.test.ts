import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  buildMADRadar,
} from "../src/engine/buildMADRadar.js";

import {
  createInMemoryMADFlightRecorder,
} from "../src/engine/madFlightRecorder.js";

import {
  createMADStateTracker,
} from "../src/engine/madStateTracker.js";

import type {
  RobinhoodUniverseScan,
} from "../src/engine/scanRobinhoodUniverse.js";

import type {
  evaluateRobinhoodCompositeState,
} from "../src/engine/evaluateRobinhoodCompositeState.js";

type CompositeResult =
  Awaited<
    ReturnType<
      typeof evaluateRobinhoodCompositeState
    >
  >;

function universeAsset(
  symbol: string,
  capability:
    | "FULL"
    | "PARTIAL"
    | "DISCOVERABLE",
) {
  return {
    feedResolution:
      capability === "FULL"
        ? "RESOLVED"
        : "MISSING",

    source: {
      asset: {
        id: `${symbol}-asset-id`,
        tokenSymbol: symbol,
        tokenName: `${symbol} • Robinhood Token`,
        deployments: [
          {
            contractAddress:
              "0x1111111111111111111111111111111111111111",
            chainId: 4663,
            networkName: "Robinhood Chain",
          },
        ],
        currentMultiplier:
          "1.000000000000000000",
        pendingMultiplier: "",
        status:
          "ASSET_STATUS_ACTIVE",
        logoUrl: "",
        tradingCapabilities: {
          market: {
            whole: "TRADABLE",
            fractional: "TRADABLE",
          },
          extended: {
            whole: "TRADABLE",
            fractional: "TRADABLE",
          },
          overnight: {
            whole: "TRADABLE",
            fractional: "TRADABLE",
          },
        },
        tokenDecimals: 18,
        isin: `${symbol}-ISIN`,
      },

      feed:
        capability === "FULL"
          ? {
              name:
                `Robinhood ${symbol} / USD`,
              proxyAddress:
                "0x2222222222222222222222222222222222222222",
              contractAddress:
                "0x3333333333333333333333333333333333333333",
              secondaryProxyAddress:
                null,
              heartbeatSeconds: 86400,
              threshold: 0.5,
              decimals: 8,
              assetClass: "Equity",
              assetSubClass: "US",
              baseAsset: symbol,
              quoteAsset: "USD",
              marketHours:
                "us_equities_24/5",
              productType: "Price",
              productTypeCode:
                "primaryTokenizedPrice",
            }
          : null,
    },

    capability: {
      symbol,

      name:
        `${symbol} • Robinhood Token`,

      assetId:
        `${symbol}-asset-id`,

      isin:
        `${symbol}-ISIN`,

      status:
        "ASSET_STATUS_ACTIVE",

      deployment: {
        address:
          "0x1111111111111111111111111111111111111111",
        chainId: 4663,
      },

      feed:
        capability === "FULL"
          ? {
              proxyAddress:
                "0x2222222222222222222222222222222222222222",
              heartbeatSeconds:
                86400,
              marketHours:
                "us_equities_24/5",
              productTypeCode:
                "primaryTokenizedPrice",
            }
          : null,

      capability,

      supportedDisorders:
        capability === "FULL"
          ? 4
          : capability === "PARTIAL"
            ? 2
            : 0,

      totalDisorders: 4,

      disorders: [],
    },
  };
}

function universe(
  assets:
    ReturnType<
      typeof universeAsset
    >[],
): RobinhoodUniverseScan {
  return {
    generatedAt:
      "2026-09-06T00:00:00.000Z",

    counts: {
      discovered:
        assets.length,

      full:
        assets.filter(
          (asset) =>
            asset.capability
              .capability ===
            "FULL",
        ).length,

      partial:
        assets.filter(
          (asset) =>
            asset.capability
              .capability ===
            "PARTIAL",
        ).length,

      discoverable:
        assets.filter(
          (asset) =>
            asset.capability
              .capability ===
            "DISCOVERABLE",
        ).length,

      ambiguousFeeds: 0,
    },

    assets:
      assets as RobinhoodUniverseScan["assets"],
  };
}

function composite(
  symbol: string,
  score = 0,
): CompositeResult {
  return {
    asset: {
      symbol,
      name:
        `${symbol} • Robinhood Token`,
      assetId:
        `${symbol}-asset-id`,
      isin:
        `${symbol}-ISIN`,
      status:
        "ASSET_STATUS_ACTIVE",
      contractAddress:
        "0x1111111111111111111111111111111111111111",
      chainId: 4663,
    },

    observations: {
      underlying:
        {} as CompositeResult["observations"]["underlying"],

      multiplier:
        {} as CompositeResult["observations"]["multiplier"],

      oracle: {
        marketAvailability:
          "OPEN",
      } as CompositeResult["observations"]["oracle"],

      timing:
        {} as CompositeResult["observations"]["timing"],
    },

    disorders: {
      assessed: [],
      unassessed: [],
    },

    mad: {
      disorderScore:
        score,

      severity:
        score > 0
          ? MADSeverity.HIGH
          : MADSeverity.NORMAL,

      disorderBitmap:
        score > 0
          ? 1n
          : 0n,

      activeDisorders:
        score > 0
          ? [
              {
                disorderId: 7,
                score,
                severity:
                  MADSeverity.HIGH,
              },
            ]
          : [],

      assessedDisorders: 4,
      unassessedDisorders: 0,
    },
  };
}

describe(
  "MAD Radar",
  () => {
    it(
      "evaluates FULL assets and preserves PARTIAL assets as capability-only",
      async () => {
        const calls:
          string[] = [];

        const result =
          await buildMADRadar(
            {
              rpcUrl:
                "https://example.invalid",
            },

            {
              scanUniverse:
                async () =>
                  universe([
                    universeAsset(
                      "NVDA",
                      "FULL",
                    ),

                    universeAsset(
                      "ADBE",
                      "PARTIAL",
                    ),
                  ]),

              evaluateComposite:
                async (input) => {
                  calls.push(
                    input.symbol,
                  );

                  return composite(
                    input.symbol,
                  );
                },

              now:
                () =>
                  new Date(
                    "2026-09-06T01:00:00.000Z",
                  ),
            },
          );

        expect(
          calls,
        ).toEqual([
          "NVDA",
        ]);

        expect(
          result.counts,
        ).toMatchObject({
          discovered: 2,
          full: 1,
          partial: 1,
          assessed: 1,
          capabilityOnly: 1,
          errors: 0,
        });

        expect(
          result.assets.find(
            (asset) =>
              asset.symbol ===
              "ADBE",
          )?.stateStatus,
        ).toBe(
          "CAPABILITY_ONLY",
        );
      },
    );

    it(
      "isolates an individual FULL asset evaluation failure",
      async () => {
        const result =
          await buildMADRadar(
            {
              rpcUrl:
                "https://example.invalid",
            },

            {
              scanUniverse:
                async () =>
                  universe([
                    universeAsset(
                      "AAPL",
                      "FULL",
                    ),

                    universeAsset(
                      "NVDA",
                      "FULL",
                    ),
                  ]),

              evaluateComposite:
                async (input) => {
                  if (
                    input.symbol ===
                    "NVDA"
                  ) {
                    throw new Error(
                      "oracle unavailable",
                    );
                  }

                  return composite(
                    input.symbol,
                  );
                },
            },
          );

        expect(
          result.counts.assessed,
        ).toBe(1);

        expect(
          result.counts.errors,
        ).toBe(1);

        expect(
          result.assets.find(
            (asset) =>
              asset.symbol ===
              "NVDA",
          ),
        ).toMatchObject({
          stateStatus:
            "ERROR",

          reason:
            "oracle unavailable",
        });
      },
    );

    it(
      "summarises disordered and normal assets",
      async () => {
        const result =
          await buildMADRadar(
            {
              rpcUrl:
                "https://example.invalid",
            },

            {
              scanUniverse:
                async () =>
                  universe([
                    universeAsset(
                      "AAPL",
                      "FULL",
                    ),

                    universeAsset(
                      "NVDA",
                      "FULL",
                    ),
                  ]),

              evaluateComposite:
                async (input) =>
                  composite(
                    input.symbol,
                    input.symbol ===
                      "NVDA"
                      ? 65
                      : 0,
                  ),
            },
          );

        expect(
          result.counts.normal,
        ).toBe(1);

        expect(
          result.counts.disordered,
        ).toBe(1);

        expect(
          result.assets.find(
            (asset) =>
              asset.symbol ===
              "NVDA",
          )?.state,
        ).toMatchObject({
          score: 65,
          severity:
            "HIGH",
        });
      },
    );

    it(
      "respects the configured evaluation concurrency",
      async () => {
        let active = 0;
        let maximum = 0;

        const symbols = [
          "AAA",
          "BBB",
          "CCC",
          "DDD",
          "EEE",
          "FFF",
        ];

        await buildMADRadar(
          {
            rpcUrl:
              "https://example.invalid",

            concurrency: 2,
          },

          {
            scanUniverse:
              async () =>
                universe(
                  symbols.map(
                    (symbol) =>
                      universeAsset(
                        symbol,
                        "FULL",
                      ),
                  ),
                ),

            evaluateComposite:
              async (input) => {
                active += 1;

                maximum =
                  Math.max(
                    maximum,
                    active,
                  );

                await new Promise(
                  (resolve) =>
                    setTimeout(
                      resolve,
                      10,
                    ),
                );

                active -= 1;

                return composite(
                  input.symbol,
                );
              },
          },
        );

        expect(
          maximum,
        ).toBeLessThanOrEqual(
          2,
        );
      },
    );

    it(
      "records successfully evaluated FULL assets at the State Diff observation boundary",
      async () => {
        const stateTracker =
          createMADStateTracker();

        const flightRecorder =
          createInMemoryMADFlightRecorder();

        await buildMADRadar(
          {
            rpcUrl:
              "https://example.invalid",
          },
          {
            scanUniverse:
              async () =>
                universe([
                  universeAsset(
                    "NVDA",
                    "FULL",
                  ),
                ]),

            evaluateComposite:
              async (input) =>
                composite(
                  input.symbol,
                  65,
                ),

            stateTracker,
            flightRecorder,

            now:
              () =>
                new Date(
                  "2026-09-07T02:00:00.000Z",
                ),
          },
        );

        const history =
          flightRecorder.history(
            "NVDA-asset-id",
          );

        expect(
          history,
        ).toHaveLength(1);

        expect(
          history[0]?.recordedAt,
        ).toBe(
          "2026-09-07T02:00:00.000Z",
        );

        expect(
          history[0]?.transition.status,
        ).toBe(
          "BASELINE_ESTABLISHED",
        );

        expect(
          history[0]?.mad.score,
        ).toBe(65);

        expect(
          history[0]?.evidence.mad.score,
        ).toBe(65);
      },
    );

    it(
      "does not record failed FULL or capability-only assets",
      async () => {
        const stateTracker =
          createMADStateTracker();

        const flightRecorder =
          createInMemoryMADFlightRecorder();

        await buildMADRadar(
          {
            rpcUrl:
              "https://example.invalid",
          },
          {
            scanUniverse:
              async () =>
                universe([
                  universeAsset(
                    "NVDA",
                    "FULL",
                  ),
                  universeAsset(
                    "ADBE",
                    "PARTIAL",
                  ),
                ]),

            evaluateComposite:
              async () => {
                throw new Error(
                  "evaluation failed",
                );
              },

            stateTracker,
            flightRecorder,
          },
        );

        expect(
          flightRecorder.size(),
        ).toBe(0);

        expect(
          flightRecorder.history(
            "NVDA-asset-id",
          ),
        ).toHaveLength(0);

        expect(
          flightRecorder.history(
            "ADBE-asset-id",
          ),
        ).toHaveLength(0);
      },
    );

    it(
      "does not create Flight Recorder history without State Diff tracking",
      async () => {
        const flightRecorder =
          createInMemoryMADFlightRecorder();

        await buildMADRadar(
          {
            rpcUrl:
              "https://example.invalid",
          },
          {
            scanUniverse:
              async () =>
                universe([
                  universeAsset(
                    "NVDA",
                    "FULL",
                  ),
                ]),

            evaluateComposite:
              async (input) =>
                composite(
                  input.symbol,
                ),

            flightRecorder,
          },
        );

        expect(
          flightRecorder.size(),
        ).toBe(0);
      },
    );

  },
);
