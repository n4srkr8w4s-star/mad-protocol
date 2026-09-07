import {
  diffMADState,
  type MADStateDiff,
  type RobinhoodCompositeState,
} from "./diffMADState.js";

export type MADStateTrackingStatus =
  | "BASELINE_ESTABLISHED"
  | "DIFF_AVAILABLE";

export interface MADStateTrackingResult {
  status: MADStateTrackingStatus;
  asset: {
    symbol: string;
    assetId: string;
  };
  diff: MADStateDiff | null;
}

export interface MADStateTracker {
  observe(
    state: RobinhoodCompositeState,
  ): MADStateTrackingResult;

  getBaseline(
    assetId: string,
  ): RobinhoodCompositeState | undefined;

  clear(
    assetId?: string,
  ): void;

  size(): number;
}

export function createMADStateTracker(): MADStateTracker {
  const baselines =
    new Map<
      string,
      RobinhoodCompositeState
    >();

  function observe(
    state: RobinhoodCompositeState,
  ): MADStateTrackingResult {
    const assetId =
      state.asset.assetId;

    const previous =
      baselines.get(assetId);

    if (!previous) {
      baselines.set(
        assetId,
        state,
      );

      return {
        status:
          "BASELINE_ESTABLISHED",
        asset: {
          symbol:
            state.asset.symbol,
          assetId,
        },
        diff: null,
      };
    }

    /*
     * Calculate the diff before advancing
     * the baseline. If comparison throws,
     * the last-good baseline is preserved.
     */
    const diff =
      diffMADState(
        previous,
        state,
      );

    baselines.set(
      assetId,
      state,
    );

    return {
      status:
        "DIFF_AVAILABLE",
      asset: {
        symbol:
          state.asset.symbol,
        assetId,
      },
      diff,
    };
  }

  function getBaseline(
    assetId: string,
  ) {
    return baselines.get(
      assetId,
    );
  }

  function clear(
    assetId?: string,
  ) {
    if (assetId === undefined) {
      baselines.clear();
      return;
    }

    baselines.delete(
      assetId,
    );
  }

  function size() {
    return baselines.size;
  }

  return {
    observe,
    getBaseline,
    clear,
    size,
  };
}
