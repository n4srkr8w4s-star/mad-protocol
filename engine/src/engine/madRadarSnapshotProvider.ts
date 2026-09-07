import {
  buildMADRadar,
  type MADRadarDependencies,
  type MADRadarInput,
  type MADRadarSnapshot,
} from "./buildMADRadar.js";

import {
  createMADStateTracker,
} from "./madStateTracker.js";

export interface MADRadarSnapshotProviderOptions {
  ttlMs?: number;

  nowMs?: () => number;

  buildSnapshot?: (
    input: MADRadarInput,
    dependencies?: MADRadarDependencies,
  ) => Promise<MADRadarSnapshot>;
}

export interface MADRadarSnapshotProvider {
  getSnapshot(
    input: MADRadarInput,
    dependencies?: MADRadarDependencies,
  ): Promise<MADRadarSnapshot>;

  clear(): void;
}

export function createMADRadarSnapshotProvider(
  options: MADRadarSnapshotProviderOptions = {},
): MADRadarSnapshotProvider {
  const ttlMs =
    options.ttlMs ?? 60_000;

  if (
    !Number.isFinite(ttlMs) ||
    ttlMs < 0
  ) {
    throw new Error(
      "Radar cache TTL must be zero or greater.",
    );
  }

  const nowMs =
    options.nowMs ??
    (() => Date.now());

  const buildSnapshot =
    options.buildSnapshot ??
    buildMADRadar;

  /*
   * State Diff memory lives for the lifetime
   * of this Radar snapshot provider.
   *
   * Cache hits do not advance the baseline.
   * Only genuine Radar rebuilds can.
   */
  const stateTracker =
    createMADStateTracker();

  let cached:
    | {
        snapshot:
          MADRadarSnapshot;

        expiresAtMs:
          number;
      }
    | undefined;

  let inFlight:
    Promise<MADRadarSnapshot> |
    undefined;

  async function getSnapshot(
    input: MADRadarInput,
    dependencies?: MADRadarDependencies,
  ): Promise<MADRadarSnapshot> {
    const currentTime =
      nowMs();

    if (
      cached &&
      currentTime <
        cached.expiresAtMs
    ) {
      return cached.snapshot;
    }

    /*
     * Prevent a public request burst from
     * triggering multiple simultaneous
     * universe-wide Radar evaluations.
     */
    if (inFlight) {
      return inFlight;
    }

    inFlight =
      buildSnapshot(
        input,
        {
          ...dependencies,
          stateTracker:
            dependencies
              ?.stateTracker ??
            stateTracker,
        },
      )
        .then(
          (snapshot) => {
            cached = {
              snapshot,

              expiresAtMs:
                nowMs() +
                ttlMs,
            };

            return snapshot;
          },
        )
        .finally(() => {
          inFlight =
            undefined;
        });

    return inFlight;
  }

  function clear() {
    cached = undefined;
  }

  return {
    getSnapshot,
    clear,
  };
}
