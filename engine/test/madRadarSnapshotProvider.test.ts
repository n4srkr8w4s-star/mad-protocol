import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createMADRadarSnapshotProvider,
} from "../src/engine/madRadarSnapshotProvider.js";

import type {
  MADRadarSnapshot,
} from "../src/engine/buildMADRadar.js";

function snapshot(
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

    assets: [],
  };
}

describe(
  "MAD Radar snapshot provider",
  () => {
    it(
      "reuses a snapshot while the TTL is valid",
      async () => {
        let builds = 0;
        let time = 1_000;

        const provider =
          createMADRadarSnapshotProvider({
            ttlMs: 60_000,

            nowMs:
              () => time,

            buildSnapshot:
              async () => {
                builds += 1;

                return snapshot(
                  `snapshot-${builds}`,
                );
              },
          });

        const first =
          await provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        time += 30_000;

        const second =
          await provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        expect(builds).toBe(1);
        expect(second).toBe(first);
      },
    );

    it(
      "refreshes after the TTL expires",
      async () => {
        let builds = 0;
        let time = 1_000;

        const provider =
          createMADRadarSnapshotProvider({
            ttlMs: 60_000,

            nowMs:
              () => time,

            buildSnapshot:
              async () => {
                builds += 1;

                return snapshot(
                  `snapshot-${builds}`,
                );
              },
          });

        const first =
          await provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        time += 60_001;

        const second =
          await provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        expect(builds).toBe(2);
        expect(second).not.toBe(first);
      },
    );

    it(
      "coalesces simultaneous refresh requests into one build",
      async () => {
        let builds = 0;

        let release:
          (() => void) |
          undefined;

        const gate =
          new Promise<void>(
            (resolve) => {
              release = resolve;
            },
          );

        const provider =
          createMADRadarSnapshotProvider({
            buildSnapshot:
              async () => {
                builds += 1;

                await gate;

                return snapshot(
                  "shared",
                );
              },
          });

        const first =
          provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        const second =
          provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        expect(builds).toBe(1);

        release?.();

        const [
          firstResult,
          secondResult,
        ] =
          await Promise.all([
            first,
            second,
          ]);

        expect(builds).toBe(1);
        expect(
          secondResult,
        ).toBe(firstResult);
      },
    );

    it(
      "can explicitly clear the cached snapshot",
      async () => {
        let builds = 0;

        const provider =
          createMADRadarSnapshotProvider({
            buildSnapshot:
              async () => {
                builds += 1;

                return snapshot(
                  `snapshot-${builds}`,
                );
              },
          });

        await provider.getSnapshot({
          rpcUrl:
            "https://example.invalid",
        });

        provider.clear();

        await provider.getSnapshot({
          rpcUrl:
            "https://example.invalid",
        });

        expect(builds).toBe(2);
      },
    );
  },
);

describe(
  "MAD Radar snapshot provider State Diff lifecycle",
  () => {
    it(
      "establishes a baseline on the first build, preserves it across cache hits, and produces a diff after TTL expiry",
      async () => {
        let time = 1_000;
        let builds = 0;

        const provider =
          createMADRadarSnapshotProvider({
            ttlMs: 60_000,
            nowMs:
              () => time,
            buildSnapshot:
              async (
                _input,
                dependencies,
              ) => {
                builds += 1;

                const tracker =
                  dependencies
                    ?.stateTracker;

                if (!tracker) {
                  throw new Error(
                    "State tracker was not injected.",
                  );
                }

                const score =
                  builds === 1
                    ? 0
                    : 25;

                const composite =
                  {
                    asset: {
                      symbol: "AAPL",
                      name: "Apple",
                      assetId:
                        "aapl-id",
                      isin:
                        "US0378331005",
                      status:
                        "ACTIVE",
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
                        currency:
                          "USD",
                        isTradingHalt:
                          false,
                        generatedAt:
                          "2026-09-07T00:00:00.000Z",
                      },

                      multiplier: {
                        robinhoodApi:
                          "1",
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
                        price:
                          "100.5",
                        answerRaw:
                          "10050000000",
                        decimals: 8,
                        updatedAt:
                          "2026-09-07T00:00:00.000Z",
                        heartbeatSeconds:
                          3600,
                        marketHours:
                          "REGULAR",
                        marketAvailability:
                          "OPEN",
                        threshold:
                          null,
                      },

                      timing: {
                        evaluationTimeUnix:
                          builds === 1
                            ? "1000"
                            : "1060",
                        robinhoodPriceAgeSeconds:
                          0,
                        oracleAgeSeconds:
                          30,
                        sourceSkewSeconds:
                          0,
                      },
                    },

                    disorders: {
                      assessed: [],
                      unassessed: [],
                    },

                    mad: {
                      disorderScore:
                        score,
                      severity:
                        score === 0
                          ? 0
                          : 1,
                      disorderBitmap:
                        0n,
                      activeDisorders:
                        [],
                      assessedDisorders:
                        0,
                      unassessedDisorders:
                        0,
                    },
                  } as any;

                const transition =
                  tracker.observe(
                    composite,
                  );

                return {
                  generatedAt:
                    `snapshot-${builds}`,
                  counts: {
                    discovered: 1,
                    full: 1,
                    partial: 0,
                    discoverable: 0,
                    assessed: 1,
                    capabilityOnly: 0,
                    errors: 0,
                    disordered:
                      score > 0
                        ? 1
                        : 0,
                    normal:
                      score === 0
                        ? 1
                        : 0,
                  },
                  sourceHealth: {
                    robinhoodPrices:
                      {
                        status:
                          "HEALTHY",
                        attempted:
                          0,
                        succeeded:
                          0,
                        failed:
                          0,
                        retried:
                          0,
                        retryEvents:
                          [],
                      } as any,
                  },
                  assets: [
                    {
                      symbol:
                        "AAPL",
                      name:
                        "Apple",
                      assetId:
                        "aapl-id",
                      isin:
                        "US0378331005",
                      address:
                        null,
                      chainId:
                        null,
                      capability:
                        "FULL",
                      supportedDisorders:
                        0,
                      totalDisorders:
                        0,
                      feedResolution:
                        {} as any,
                      stateStatus:
                        "ASSESSED",
                      state: {
                        score,
                        severityCode:
                          score === 0
                            ? 0
                            : 1,
                        severity:
                          score === 0
                            ? "NORMAL"
                            : "WATCH",
                        assessedDisorders:
                          0,
                        unassessedDisorders:
                          0,
                        marketAvailability:
                          "OPEN",
                        activeDisorders:
                          [],
                      },
                      transition,
                      reason:
                        null,
                    },
                  ],
                } as MADRadarSnapshot;
              },
          });

        const first =
          await provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        expect(builds).toBe(1);

        expect(
          first.assets[0]
            ?.transition
            ?.status,
        ).toBe(
          "BASELINE_ESTABLISHED",
        );

        time += 30_000;

        const cached =
          await provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        expect(builds).toBe(1);
        expect(cached).toBe(first);

        time += 30_001;

        const second =
          await provider.getSnapshot({
            rpcUrl:
              "https://example.invalid",
          });

        expect(builds).toBe(2);

        expect(
          second.assets[0]
            ?.transition
            ?.status,
        ).toBe(
          "DIFF_AVAILABLE",
        );

        expect(
          second.assets[0]
            ?.transition
            ?.diff
            ?.score.delta,
        ).toBe(25);
      },
    );
  },
);
