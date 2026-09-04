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
