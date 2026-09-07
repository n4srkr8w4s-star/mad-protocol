import {
  MADSeverity,
  type ActiveDisorderId,
} from "../domain/types.js";

import type {
  evaluateRobinhoodCompositeState,
} from "./evaluateRobinhoodCompositeState.js";

export type RobinhoodCompositeState =
  Awaited<
    ReturnType<
      typeof evaluateRobinhoodCompositeState
    >
  >;

export interface MADStateDiffDisorder {
  disorderId: ActiveDisorderId;
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  previousSeverity: MADSeverity;
  currentSeverity: MADSeverity;
}

export type MADStateChangeType =
  | "SCORE_CHANGED"
  | "SEVERITY_CHANGED"
  | "DISORDER_ACTIVATED"
  | "DISORDER_CLEARED"
  | "DISORDER_CHANGED"
  | "ASSESSMENT_CHANGED"
  | "MULTIPLIER_CHANGED"
  | "MARKET_AVAILABILITY_CHANGED";

export interface MADStateDiff {
  asset: {
    symbol: string;
    assetId: string;
  };

  from: {
    evaluationTimeUnix: string;
    score: number;
    severity: MADSeverity;
    disorderBitmap: string;
  };

  to: {
    evaluationTimeUnix: string;
    score: number;
    severity: MADSeverity;
    disorderBitmap: string;
  };

  changed: boolean;

  changeTypes:
    MADStateChangeType[];

  score: {
    previous: number;
    current: number;
    delta: number;
  };

  severity: {
    previous: MADSeverity;
    current: MADSeverity;
    changed: boolean;
  };

  disorders: {
    activated: ActiveDisorderId[];
    cleared: ActiveDisorderId[];
    changed: MADStateDiffDisorder[];
  };

  assessment: {
    previousAssessed: number;
    currentAssessed: number;
    previousUnassessed: number;
    currentUnassessed: number;
    changed: boolean;
  };

  observations: {
    underlyingMidpointChanged: boolean;
    multiplierChanged: boolean;
    oraclePriceChanged: boolean;
    oracleFreshnessChanged: boolean;
    marketAvailabilityChanged: boolean;
  };
}

function disorderMap(
  state: RobinhoodCompositeState,
) {
  return new Map(
    state.disorders.assessed.map(
      (disorder) => [
        disorder.id,
        disorder.evaluation,
      ],
    ),
  );
}

export function diffMADState(
  previous: RobinhoodCompositeState,
  current: RobinhoodCompositeState,
): MADStateDiff {
  if (
    previous.asset.assetId !==
    current.asset.assetId
  ) {
    throw new Error(
      "MAD State Diff requires states for the same asset.",
    );
  }

  const previousDisorders =
    disorderMap(previous);

  const currentDisorders =
    disorderMap(current);

  const activated: ActiveDisorderId[] = [];
  const cleared: ActiveDisorderId[] = [];
  const changed: MADStateDiffDisorder[] = [];

  const disorderIds =
    new Set([
      ...previousDisorders.keys(),
      ...currentDisorders.keys(),
    ]);

  for (const disorderId of disorderIds) {
    const before =
      previousDisorders.get(disorderId);

    const after =
      currentDisorders.get(disorderId);

    if (!before || !after) {
      continue;
    }

    if (!before.active && after.active) {
      activated.push(disorderId);
    }

    if (before.active && !after.active) {
      cleared.push(disorderId);
    }

    if (
      before.score !== after.score ||
      before.severity !== after.severity
    ) {
      changed.push({
        disorderId,
        previousScore: before.score,
        currentScore: after.score,
        scoreDelta:
          after.score - before.score,
        previousSeverity:
          before.severity,
        currentSeverity:
          after.severity,
      });
    }
  }

  const scoreDelta =
    current.mad.disorderScore -
    previous.mad.disorderScore;

  const severityChanged =
    previous.mad.severity !==
    current.mad.severity;

  const assessmentChanged =
    previous.mad.assessedDisorders !==
      current.mad.assessedDisorders ||
    previous.mad.unassessedDisorders !==
      current.mad.unassessedDisorders;

  const underlyingMidpointChanged =
    previous.observations.underlying
      .midpointE6 !==
    current.observations.underlying
      .midpointE6;

  const multiplierChanged =
    previous.observations.multiplier
      .robinhoodApiE18 !==
      current.observations.multiplier
        .robinhoodApiE18 ||
    previous.observations.multiplier
      .onchainE18 !==
      current.observations.multiplier
        .onchainE18 ||
    previous.observations.multiplier
      .pending !==
      current.observations.multiplier
        .pending;

  const oraclePriceChanged =
    previous.observations.oracle
      .answerRaw !==
    current.observations.oracle
      .answerRaw;

  const oracleFreshnessChanged =
    previous.observations.timing
      .oracleAgeSeconds !==
    current.observations.timing
      .oracleAgeSeconds;

  const marketAvailabilityChanged =
    previous.observations.oracle
      .marketAvailability !==
    current.observations.oracle
      .marketAvailability;

  const changeTypes:
    MADStateChangeType[] = [];

  if (scoreDelta !== 0) {
    changeTypes.push(
      "SCORE_CHANGED",
    );
  }

  if (severityChanged) {
    changeTypes.push(
      "SEVERITY_CHANGED",
    );
  }

  if (activated.length > 0) {
    changeTypes.push(
      "DISORDER_ACTIVATED",
    );
  }

  if (cleared.length > 0) {
    changeTypes.push(
      "DISORDER_CLEARED",
    );
  }

  if (changed.length > 0) {
    changeTypes.push(
      "DISORDER_CHANGED",
    );
  }

  if (assessmentChanged) {
    changeTypes.push(
      "ASSESSMENT_CHANGED",
    );
  }

  if (multiplierChanged) {
    changeTypes.push(
      "MULTIPLIER_CHANGED",
    );
  }

  if (marketAvailabilityChanged) {
    changeTypes.push(
      "MARKET_AVAILABILITY_CHANGED",
    );
  }

  const changedOverall =
    changeTypes.length > 0;

  return {
    asset: {
      symbol: current.asset.symbol,
      assetId: current.asset.assetId,
    },

    from: {
      evaluationTimeUnix:
        previous.observations.timing
          .evaluationTimeUnix,
      score:
        previous.mad.disorderScore,
      severity:
        previous.mad.severity,
      disorderBitmap:
        previous.mad.disorderBitmap
          .toString(),
    },

    to: {
      evaluationTimeUnix:
        current.observations.timing
          .evaluationTimeUnix,
      score:
        current.mad.disorderScore,
      severity:
        current.mad.severity,
      disorderBitmap:
        current.mad.disorderBitmap
          .toString(),
    },

    changed: changedOverall,

    changeTypes,

    score: {
      previous:
        previous.mad.disorderScore,
      current:
        current.mad.disorderScore,
      delta: scoreDelta,
    },

    severity: {
      previous:
        previous.mad.severity,
      current:
        current.mad.severity,
      changed: severityChanged,
    },

    disorders: {
      activated,
      cleared,
      changed,
    },

    assessment: {
      previousAssessed:
        previous.mad.assessedDisorders,
      currentAssessed:
        current.mad.assessedDisorders,
      previousUnassessed:
        previous.mad.unassessedDisorders,
      currentUnassessed:
        current.mad.unassessedDisorders,
      changed:
        assessmentChanged,
    },

    observations: {
      underlyingMidpointChanged,
      multiplierChanged,
      oraclePriceChanged,
      oracleFreshnessChanged,
      marketAvailabilityChanged,
    },
  };
}
