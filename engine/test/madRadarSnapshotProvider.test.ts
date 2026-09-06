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
