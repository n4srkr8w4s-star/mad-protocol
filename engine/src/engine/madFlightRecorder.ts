import type {
  MADStateTrackingResult,
} from "./madStateTracker.js";

import {
  buildEvidenceDNA,
  type MADEvidenceDNA,
} from "./buildEvidenceDNA.js";

import type {
  RobinhoodCompositeState,
} from "./diffMADState.js";

export interface MADFlightRecord {
  recordVersion: 1;

  recordedAt: string;

  asset: {
    symbol: string;
    assetId: string;
  };

  mad: {
    score: number;
    severity: RobinhoodCompositeState["mad"]["severity"];
    activeDisorders:
      RobinhoodCompositeState["mad"]["activeDisorders"];
  };

  transition:
    MADStateTrackingResult;

  evidence:
    MADEvidenceDNA;

  observations:
    RobinhoodCompositeState["observations"];
}

export interface MADFlightRecorder {
  append(
    record: MADFlightRecord,
  ): void;

  history(
    assetId: string,
  ): readonly MADFlightRecord[];

  clear(
    assetId?: string,
  ): void;

  size(): number;
}

export function buildMADFlightRecord(
  state: RobinhoodCompositeState,
  transition: MADStateTrackingResult,
  recordedAt: Date,
): MADFlightRecord {
  if (
    transition.asset.assetId !==
    state.asset.assetId
  ) {
    throw new Error(
      "Flight Recorder transition asset does not match composite state asset.",
    );
  }

  return {
    recordVersion: 1,

    recordedAt:
      recordedAt.toISOString(),

    asset: {
      symbol:
        state.asset.symbol,
      assetId:
        state.asset.assetId,
    },

    mad: {
      score:
        state.mad.disorderScore,
      severity:
        state.mad.severity,
      activeDisorders:
        state.mad.activeDisorders,
    },

    transition,

    evidence:
      buildEvidenceDNA(state),

    observations:
      state.observations,
  };
}

export function createInMemoryMADFlightRecorder():
  MADFlightRecorder {
  const records =
    new Map<
      string,
      MADFlightRecord[]
    >();

  function append(
    record: MADFlightRecord,
  ) {
    const assetId =
      record.asset.assetId;

    const history =
      records.get(assetId) ?? [];

    history.push(record);

    records.set(
      assetId,
      history,
    );
  }

  function history(
    assetId: string,
  ): readonly MADFlightRecord[] {
    return [
      ...(records.get(assetId) ?? []),
    ];
  }

  function clear(
    assetId?: string,
  ) {
    if (assetId === undefined) {
      records.clear();
      return;
    }

    records.delete(assetId);
  }

  function size() {
    let count = 0;

    for (
      const history of
      records.values()
    ) {
      count += history.length;
    }

    return count;
  }

  return {
    append,
    history,
    clear,
    size,
  };
}
