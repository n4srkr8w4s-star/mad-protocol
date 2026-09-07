import {
  buildMADRadar,
  type MADRadarDependencies,
  type MADRadarInput,
  type MADRadarSnapshot,
} from "./buildMADRadar.js";

import {
  createMADStateTracker,
  type MADStateTracker,
} from "./madStateTracker.js";

import {
  buildMADFlightRecord,
  createInMemoryMADFlightRecorder,
  type MADFlightRecord,
} from "./madFlightRecorder.js";

import {
  createFileMADObservationStore,
} from "./madObservationStore.js";

export interface MADRadarSnapshotProviderOptions {
  ttlMs?: number;

  nowMs?: () => number;

  buildSnapshot?: (
    input: MADRadarInput,
    dependencies?: MADRadarDependencies,
  ) => Promise<MADRadarSnapshot>;

  observationStorePath?: string;
}

export interface MADRadarSnapshotProvider {
  getSnapshot(
    input: MADRadarInput,
    dependencies?: MADRadarDependencies,
  ): Promise<MADRadarSnapshot>;
  history(
    assetId: string,
  ): readonly MADFlightRecord[];


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

  /*
   * Flight Recorder history shares the
   * provider lifetime with State Diff memory.
   */
  const flightRecorder =
    createInMemoryMADFlightRecorder();

  const observationStore =
    options.observationStorePath
      ? createFileMADObservationStore(
          options.observationStorePath,
        )
      : undefined;

  /*
   * The durable-aware tracker restores
   * the last-good baseline before the
   * first observation for an asset after
   * process restart.
   */
  const durableStateTracker:
    MADStateTracker =
    observationStore
      ? {
          observe(state) {
            const assetId =
              state.asset.assetId;

            if (
              !stateTracker.getBaseline(
                assetId,
              )
            ) {
              const persisted =
                observationStore
                  .getBaseline(
                    assetId,
                  );

              if (persisted) {
                stateTracker
                  .restoreBaseline(
                    persisted,
                  );
              }
            }

            return stateTracker
              .observe(state);
          },

          getBaseline(assetId) {
            return (
              stateTracker
                .getBaseline(
                  assetId,
                ) ??
              observationStore
                .getBaseline(
                  assetId,
                )
            );
          },

          restoreBaseline(state) {
            stateTracker
              .restoreBaseline(
                state,
              );
          },

          replaceBaseline(
            assetId,
            state,
          ) {
            stateTracker
              .replaceBaseline(
                assetId,
                state,
              );
          },

          clear(assetId) {
            /*
             * Provider lifecycle clearing
             * must not erase durable MAD
             * intelligence.
             */
            stateTracker.clear(
              assetId,
            );
          },

          size() {
            return stateTracker.size();
          },
        }
      : stateTracker;

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
            durableStateTracker,

          flightRecorder:
            dependencies
              ?.flightRecorder ??
            flightRecorder,

          commitObservation:
            dependencies
              ?.commitObservation ??
            (
              observationStore
                ? (
                    composite,
                    transition,
                    recordedAt,
                  ) => {
                    const record =
                      buildMADFlightRecord(
                        composite,
                        transition,
                        recordedAt,
                      );

                    observationStore
                      .commitObservation(
                        composite,
                        record,
                      );

                    flightRecorder.append(
                      record,
                    );

                  }
                : undefined
            ),
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
  function history(
    assetId: string,
  ) {
    if (observationStore) {
      return observationStore.history(
        assetId,
      );
    }

    return flightRecorder.history(
      assetId,
    );
  }


  function clear() {
    cached = undefined;
  }

  return {
    getSnapshot,
    history,
    clear,
  };
}
