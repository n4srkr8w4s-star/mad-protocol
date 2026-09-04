import {
  ActiveDisorderId,
  MADSeverity,
} from "../domain/types.js";

import {
  severityFromScore,
} from "../scoring/severity.js";

export interface ReferenceFreshnessPolicy {
  watchAfterSeconds: number;
  elevatedAfterSeconds: number;
  highAfterSeconds: number;
  criticalAfterSeconds: number;
}

export interface ReferenceDataStaleInput {
  evaluationTimeUnix: bigint;
  sourceUpdatedAtUnix: bigint;
  policy: ReferenceFreshnessPolicy;
}

export interface ReferenceDataStaleEvaluation {
  disorderId:
    ActiveDisorderId.REFERENCE_DATA_STALE;

  active: boolean;
  score: number;
  severity: MADSeverity;

  ageSeconds: number;

  evaluationTimeUnix: string;
  sourceUpdatedAtUnix: string;

  reason: string;
}

export function evaluateReferenceDataStale(
  input: ReferenceDataStaleInput,
): ReferenceDataStaleEvaluation {
  const {
    watchAfterSeconds,
    elevatedAfterSeconds,
    highAfterSeconds,
    criticalAfterSeconds,
  } = input.policy;

  if (
    watchAfterSeconds < 0 ||
    elevatedAfterSeconds <= watchAfterSeconds ||
    highAfterSeconds <= elevatedAfterSeconds ||
    criticalAfterSeconds <= highAfterSeconds
  ) {
    throw new Error(
      "Invalid reference freshness policy thresholds",
    );
  }

  if (
    input.evaluationTimeUnix <= 0n ||
    input.sourceUpdatedAtUnix <= 0n
  ) {
    throw new Error(
      "Source timestamps must be greater than zero",
    );
  }

  if (
    input.sourceUpdatedAtUnix >
    input.evaluationTimeUnix
  ) {
    throw new Error(
      "Source timestamp cannot be later than evaluation time",
    );
  }

  const ageSeconds =
    Number(
      input.evaluationTimeUnix -
        input.sourceUpdatedAtUnix,
    );

  let score = 0;

  if (
    ageSeconds >=
    criticalAfterSeconds
  ) {
    score = 80;
  } else if (
    ageSeconds >=
    highAfterSeconds
  ) {
    score = 65;
  } else if (
    ageSeconds >=
    elevatedAfterSeconds
  ) {
    score = 40;
  } else if (
    ageSeconds >=
    watchAfterSeconds
  ) {
    score = 20;
  }

  const active = score > 0;

  return {
    disorderId:
      ActiveDisorderId.REFERENCE_DATA_STALE,

    active,
    score,

    severity:
      severityFromScore(score),

    ageSeconds,

    evaluationTimeUnix:
      input.evaluationTimeUnix.toString(),

    sourceUpdatedAtUnix:
      input.sourceUpdatedAtUnix.toString(),

    reason: active
      ? `Reference data is ${ageSeconds} seconds old and exceeds the configured MAD freshness tolerance.`
      : `Reference data age is ${ageSeconds} seconds and is within the configured MAD freshness tolerance.`,
  };
}

export type ReferenceMarketAvailability =
  | "OPEN"
  | "CLOSED"
  | "UNKNOWN";

export interface HeartbeatReferenceDataStaleInput {
  evaluationTimeUnix: bigint;
  sourceUpdatedAtUnix: bigint;

  heartbeatSeconds: number;

  marketAvailability:
    ReferenceMarketAvailability;
}

export interface HeartbeatReferenceDataStaleEvaluation {
  disorderId:
    ActiveDisorderId.REFERENCE_DATA_STALE;

  active: boolean;
  score: number;
  severity: MADSeverity;

  ageSeconds: number;
  heartbeatSeconds: number;
  heartbeatBreached: boolean;

  marketAvailability:
    ReferenceMarketAvailability;

  reason: string;
}

export function evaluateHeartbeatReferenceDataStale(
  input: HeartbeatReferenceDataStaleInput,
): HeartbeatReferenceDataStaleEvaluation {
  if (
    !Number.isInteger(
      input.heartbeatSeconds,
    ) ||
    input.heartbeatSeconds <= 0
  ) {
    throw new Error(
      "Heartbeat must be a positive integer",
    );
  }

  if (
    input.evaluationTimeUnix <= 0n ||
    input.sourceUpdatedAtUnix <= 0n
  ) {
    throw new Error(
      "Source timestamps must be greater than zero",
    );
  }

  if (
    input.sourceUpdatedAtUnix >
    input.evaluationTimeUnix
  ) {
    throw new Error(
      "Source timestamp cannot be later than evaluation time",
    );
  }

  if (
    input.marketAvailability ===
    "UNKNOWN"
  ) {
    throw new Error(
      "Cannot assess reference freshness with unknown market-hours semantics",
    );
  }

  const ageSeconds =
    Number(
      input.evaluationTimeUnix -
        input.sourceUpdatedAtUnix,
    );

  const heartbeatBreached =
    ageSeconds >
    input.heartbeatSeconds;

  /*
   * Outside the feed's active market window,
   * lack of updates is not itself a stale-data disorder.
   */
  if (
    input.marketAvailability ===
    "CLOSED"
  ) {
    return {
      disorderId:
        ActiveDisorderId.REFERENCE_DATA_STALE,

      active: false,
      score: 0,
      severity:
        MADSeverity.NORMAL,

      ageSeconds,
      heartbeatSeconds:
        input.heartbeatSeconds,

      heartbeatBreached,
      marketAvailability:
        input.marketAvailability,

      reason:
        "Reference market is closed; heartbeat age is not treated as a stale-data disorder.",
    };
  }

  const score =
    heartbeatBreached
      ? 65
      : 0;

  return {
    disorderId:
      ActiveDisorderId.REFERENCE_DATA_STALE,

    active:
      heartbeatBreached,

    score,

    severity:
      severityFromScore(score),

    ageSeconds,

    heartbeatSeconds:
      input.heartbeatSeconds,

    heartbeatBreached,

    marketAvailability:
      input.marketAvailability,

    reason:
      heartbeatBreached
        ? `Reference data age of ${ageSeconds} seconds exceeds the published ${input.heartbeatSeconds}-second heartbeat while the market is open.`
        : `Reference data age of ${ageSeconds} seconds is within the published ${input.heartbeatSeconds}-second heartbeat.`,
  };
}
