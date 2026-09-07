import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

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
  buildMADRadar,
  type MADRadarSnapshot,
} from "../src/engine/buildMADRadar.js";

import {
  createMADRadarSnapshotProvider,
} from "../src/engine/madRadarSnapshotProvider.js";

import {
  createMADStateTracker,
} from "../src/engine/madStateTracker.js";

import type {
  RobinhoodCompositeState,
} from "../src/engine/diffMADState.js";

const tempDirectories:
  string[] = [];

function tempStorePath() {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        "mad-radar-durable-",
      ),
    );

  tempDirectories.push(
    directory,
  );

  return join(
    directory,
    "observations.json",
  );
}

function composite(
  score: number,
  evaluationTimeUnix: string,
): RobinhoodCompositeState {
  return {
    asset: {
      symbol: "AAPL",
      name: "Apple",
      assetId: "aapl-id",
      isin: "US0378331005",
      status: "ACTIVE",
      contractAddress:
        "0x0000000000000000000000000000000000000001",
      chainId: 1,
    },

    observations: {
      underlying: {
        bid: "100",
        ask: "101",
        midpointE6:
          "100500000",
        currency: "USD",
        isTradingHalt: false,
        generatedAt:
          "2026-09-07T00:00:00.000Z",
      },

      multiplier: {
        robinhoodApi: "1",
        robinhoodApiE18:
          "1000000000000000000",
        onchainE18:
          "1000000000000000000",
        pending: null,
      },

      oracle: {
        feedAddress:
          "0x0000000000000000000000000000000000000002",
        description:
          "AAPL / USD",
        price: "100.5",
        answerRaw:
          "10050000000",
        decimals: 8,
        updatedAt:
          "2026-09-07T00:00:00.000Z",
        heartbeatSeconds: 3600,
        marketHours: "REGULAR",
        marketAvailability: "OPEN",
        threshold: null,
      },

      timing: {
        evaluationTimeUnix,
        robinhoodPriceAgeSeconds: 0,
        oracleAgeSeconds: 30,
        sourceSkewSeconds: 0,
      },
    },

    disorders: {
      assessed: [],
      unassessed: [],
    },

    mad: {
      disorderScore: score,
      severity:
        (
          score === 0
            ? MADSeverity.NORMAL
            : MADSeverity.HIGH
        ),
      disorderBitmap: 0n,
      activeDisorders: [],
      assessedDisorders: 0,
      unassessedDisorders: 0,
    },
  } as unknown as
    RobinhoodCompositeState;
}

function emptySnapshot(
  generatedAt: string,
): MADRadarSnapshot {
  return {
    generatedAt,

    counts: {
      discovered: 0,
      full: 0,
      partial: 0,
      discoverable: 0,
      assessed: 0,
      capabilityOnly: 0,
      errors: 0,
      disordered: 0,
      normal: 0,
    },

    sourceHealth: {
      robinhoodPrices: {
        status: "HEALTHY",
        attempted: 0,
        succeeded: 0,
        failed: 0,
        retried: 0,
        retryEvents: [],
      },
    },

    assets: [],
  } as MADRadarSnapshot;
}

afterEach(() => {
  for (
    const directory of
    tempDirectories.splice(0)
  ) {
    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

describe(
  "MAD Radar durable observation lifecycle",
  () => {
    it(
      "continues State Diff from the persisted baseline after provider restart",
      async () => {
        const storePath =
          tempStorePath();

        let firstTransition:
          ReturnType<
            ReturnType<
              typeof createMADStateTracker
            >["observe"]
          > | undefined;

        const firstProvider =
          createMADRadarSnapshotProvider({
            ttlMs: 0,
            observationStorePath:
              storePath,

            buildSnapshot:
              async (
                _input,
                dependencies,
              ) => {
                const tracker =
                  dependencies
                    ?.stateTracker;

                const commit =
                  dependencies
                    ?.commitObservation;

                if (
                  !tracker ||
                  !commit
                ) {
                  throw new Error(
                    "Durable observation dependencies were not injected.",
                  );
                }

                const state =
                  composite(
                    25,
                    "1000",
                  );

                firstTransition =
                  tracker.observe(
                    state,
                  );

                commit(
                  state,
                  firstTransition,
                  new Date(
                    "2026-09-07T01:00:00.000Z",
                  ),
                );

                return emptySnapshot(
                  "first",
                );
              },
          });

        await firstProvider
          .getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        expect(
          firstTransition?.status,
        ).toBe(
          "BASELINE_ESTABLISHED",
        );

        expect(
          firstProvider.history(
            "aapl-id",
          ),
        ).toHaveLength(1);

        let restartedTransition:
          ReturnType<
            ReturnType<
              typeof createMADStateTracker
            >["observe"]
          > | undefined;

        /*
         * New provider instance simulates a
         * new MAD process using the same
         * durable Observation Store.
         */
        const restartedProvider =
          createMADRadarSnapshotProvider({
            ttlMs: 0,
            observationStorePath:
              storePath,

            buildSnapshot:
              async (
                _input,
                dependencies,
              ) => {
                const tracker =
                  dependencies
                    ?.stateTracker;

                const commit =
                  dependencies
                    ?.commitObservation;

                if (
                  !tracker ||
                  !commit
                ) {
                  throw new Error(
                    "Durable observation dependencies were not injected.",
                  );
                }

                const state =
                  composite(
                    50,
                    "1060",
                  );

                restartedTransition =
                  tracker.observe(
                    state,
                  );

                commit(
                  state,
                  restartedTransition,
                  new Date(
                    "2026-09-07T01:01:00.000Z",
                  ),
                );

                return emptySnapshot(
                  "second",
                );
              },
          });

        await restartedProvider
          .getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        expect(
          restartedTransition?.status,
        ).toBe(
          "DIFF_AVAILABLE",
        );

        expect(
          restartedTransition
            ?.diff
            ?.score
            .previous,
        ).toBe(25);

        expect(
          restartedTransition
            ?.diff
            ?.score
            .current,
        ).toBe(50);

        expect(
          restartedTransition
            ?.diff
            ?.score
            .delta,
        ).toBe(25);

        expect(
          restartedProvider.history(
            "aapl-id",
          ),
        ).toHaveLength(2);

        expect(
          restartedProvider.history(
            "aapl-id",
          )[0]
            .transition.status,
        ).toBe(
          "BASELINE_ESTABLISHED",
        );

        expect(
          restartedProvider.history(
            "aapl-id",
          )[1]
            .transition.status,
        ).toBe(
          "DIFF_AVAILABLE",
        );
      },
    );

    it(
      "rolls the State Diff baseline back when durable commit fails",
      async () => {
        const tracker =
          createMADStateTracker();

        tracker.observe(
          composite(
            25,
            "1000",
          ),
        );

        const radar =
          await buildMADRadar(
            {
              rpcUrl:
                "https://example.invalid",
              concurrency: 1,
            },
            {
              scanUniverse:
                async () =>
                  ({
                    generatedAt:
                      "2026-09-07T01:01:00.000Z",

                    counts: {
                      discovered: 1,
                      full: 1,
                      partial: 0,
                      discoverable: 0,
                    },

                    assets: [
                      {
                        capability: {
                          symbol: "AAPL",
                          name: "Apple",
                          assetId:
                            "aapl-id",
                          isin:
                            "US0378331005",
                          capability:
                            "FULL",
                          supportedDisorders:
                            4,
                          totalDisorders:
                            4,
                          deployment: {
                            address:
                              "0x0000000000000000000000000000000000000001",
                            chainId: 1,
                          },
                        },

                        feedResolution:
                          {
                            status:
                              "RESOLVED",
                          },

                        source: {
                          asset: {
                            symbol:
                              "AAPL",
                          },

                          feed: {
                            feedAddress:
                              "0x0000000000000000000000000000000000000002",
                          },
                        },
                      },
                    ],
                  }) as any,

              evaluateComposite:
                async () =>
                  composite(
                    50,
                    "1060",
                  ),

              stateTracker:
                tracker,

              commitObservation:
                () => {
                  throw new Error(
                    "simulated durable write failure",
                  );
                },

              now:
                () =>
                  new Date(
                    "2026-09-07T01:01:00.000Z",
                  ),
            },
          );

        /*
         * Radar contains the asset as an
         * evaluation error because the
         * durable observation commit did
         * not complete.
         */
        expect(
          radar.assets,
        ).toHaveLength(1);

        expect(
          radar.assets[0]
            ?.stateStatus,
        ).toBe("ERROR");

        /*
         * Most importantly, the failed
         * observation must not become the
         * next State Diff baseline.
         */
        expect(
          tracker
            .getBaseline(
              "aapl-id",
            )
            ?.mad
            .disorderScore,
        ).toBe(25);

        const next =
          tracker.observe(
            composite(
              75,
              "1120",
            ),
          );

        expect(
          next.status,
        ).toBe(
          "DIFF_AVAILABLE",
        );

        expect(
          next.diff
            ?.score
            .previous,
        ).toBe(25);

        expect(
          next.diff
            ?.score
            .current,
        ).toBe(75);

        expect(
          next.diff
            ?.score
            .delta,
        ).toBe(50);
      },
    );
  },
);
