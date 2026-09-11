import type {
  RobinhoodAssetCapability,
} from "./resolveRobinhoodCapability.js";

import type {
  RobinhoodCompositeState,
} from "./diffMADState.js";

import type {
  RobinhoodPriceSourceHealth,
} from "./robinhoodPriceSourceHealth.js";

import type {
  MADUnassessedDisposition,
} from "./evaluateRobinhoodCompositeState.js";

export type MADAssessmentCoverageStatus =
  | "COMPLETE"
  | "PARTIAL"
  | "INSUFFICIENT";

export interface MADAssessmentCoverageGap {
  disorderId: number;
  code: string;
  disposition: "EVIDENCE_UNAVAILABLE";
  reason: string;
}

export interface MADAssessmentCoverage {
  status: MADAssessmentCoverageStatus;
  applicable: number;
  assessed: number;
  notApplicable: number;
  unavailable: number;
  unsupported: number;
  gaps: MADAssessmentCoverageGap[];
}

interface UnassessedOutcome {
  id: number;
  code: string;
  disposition: MADUnassessedDisposition;
  reason: string;
}

export function buildAssessmentCoverage(
  composite: RobinhoodCompositeState,
  capability: RobinhoodAssetCapability,
): MADAssessmentCoverage {
  const assessedIds = new Set(
    composite.disorders.assessed.map(
      (disorder) => Number(disorder.id),
    ),
  );

  const unassessedById = new Map<number, UnassessedOutcome>(
    composite.disorders.unassessed.map(
      (disorder) => [
        Number(disorder.id),
        disorder as UnassessedOutcome,
      ],
    ),
  );

  let applicable = 0;
  let assessed = 0;
  let notApplicable = 0;
  let unavailable = 0;
  let unsupported = 0;

  const gaps: MADAssessmentCoverageGap[] = [];

  for (const disorder of capability.disorders) {
    if (!disorder.supported) {
      unsupported += 1;
      continue;
    }

    const disorderId = Number(disorder.id);

    if (assessedIds.has(disorderId)) {
      applicable += 1;
      assessed += 1;
      continue;
    }

    const unassessed =
      unassessedById.get(disorderId);

    if (
      unassessed?.disposition ===
      "NOT_APPLICABLE"
    ) {
      notApplicable += 1;
      continue;
    }

    applicable += 1;
    unavailable += 1;

    gaps.push({
      disorderId,
      code: disorder.code,
      disposition: "EVIDENCE_UNAVAILABLE",
      reason:
        unassessed?.reason ??
        "Supported disorder has no trustworthy assessment outcome.",
    });
  }

  const status: MADAssessmentCoverageStatus =
    unavailable === 0
      ? "COMPLETE"
      : assessed === 0
        ? "INSUFFICIENT"
        : "PARTIAL";

  return {
    status,
    applicable,
    assessed,
    notApplicable,
    unavailable,
    unsupported,
    gaps,
  };
}


export type MADAssessmentFreshnessStatus =
  | "FRESH"
  | "DEGRADED"
  | "STALE"
  | "UNKNOWN";

export interface MADAssessmentFreshness {
  status: MADAssessmentFreshnessStatus;

  /*
   * Raw timing remains observable independently
   * from the freshness judgement.
   */
  oracleAgeSeconds: number;
  robinhoodPriceAgeSeconds: number;
  sourceSkewSeconds: number;

  /*
   * The oracle heartbeat is currently MAD's only
   * explicit source freshness policy.
   *
   * No arbitrary freshness threshold is invented
   * for the Robinhood price observation.
   */
  oracleHeartbeatSeconds: number;

  marketAvailability:
    | "OPEN"
    | "CLOSED"
    | "UNKNOWN";

  reason: string;
}

export function buildAssessmentFreshness(
  composite: RobinhoodCompositeState,
): MADAssessmentFreshness {
  const timing =
    composite.observations.timing;

  const oracle =
    composite.observations.oracle;

  const marketAvailability =
    oracle.marketAvailability;

  const oracleAgeSeconds =
    timing.oracleAgeSeconds;

  const oracleHeartbeatSeconds =
    oracle.heartbeatSeconds;

  const base = {
    oracleAgeSeconds,
    robinhoodPriceAgeSeconds:
      timing.robinhoodPriceAgeSeconds,
    sourceSkewSeconds:
      timing.sourceSkewSeconds,
    oracleHeartbeatSeconds,
    marketAvailability,
  };

  if (
    marketAvailability === "UNKNOWN"
  ) {
    return {
      status: "UNKNOWN",
      ...base,
      reason:
        "Reference-market availability is unknown, so MAD cannot apply the published heartbeat in the correct market context.",
    };
  }

  /*
   * Outside the active reference-market window,
   * lack of oracle updates is expected and does
   * not make the assessment evidence stale.
   */
  if (
    marketAvailability === "CLOSED"
  ) {
    return {
      status: "FRESH",
      ...base,
      reason:
        "Reference market is closed; the published heartbeat update cadence is not expected outside the active market window.",
    };
  }

  if (
    oracleAgeSeconds >
    oracleHeartbeatSeconds
  ) {
    return {
      status: "STALE",
      ...base,
      reason:
        `Oracle evidence age of ${oracleAgeSeconds} seconds exceeds the published ${oracleHeartbeatSeconds}-second heartbeat while the reference market is open.`,
    };
  }

  return {
    status: "FRESH",
    ...base,
    reason:
      `Oracle evidence age of ${oracleAgeSeconds} seconds is within the published ${oracleHeartbeatSeconds}-second heartbeat.`,
  };
}


export interface MADAssessmentSourceHealth {
  status:
    | "UNKNOWN"
    | "HEALTHY"
    | "DEGRADED"
    | "UNAVAILABLE";

  sources: Array<{
    source: "ROBINHOOD_PRICES";
    status:
      | "UNKNOWN"
      | "HEALTHY"
      | "DEGRADED"
      | "UNAVAILABLE";
    requestAttempts: number;
    rateLimitEvents: number;
    recoveredAssets: number;
    failedAssets: number;
    affectedAssets: string[];
  }>;

  reason: string;
}

export function buildAssessmentSourceHealth(
  robinhoodPrices:
    RobinhoodPriceSourceHealth | undefined,
): MADAssessmentSourceHealth {
  if (!robinhoodPrices) {
    return {
      status: "UNKNOWN",
      sources: [],
      reason:
        "No source-health observation was supplied for this assessment.",
    };
  }

  const source = {
    source:
      robinhoodPrices.source,
    status:
      robinhoodPrices.status,
    requestAttempts:
      robinhoodPrices.requestAttempts,
    rateLimitEvents:
      robinhoodPrices.rateLimitEvents,
    recoveredAssets:
      robinhoodPrices.recoveredAssets,
    failedAssets:
      robinhoodPrices.failedAssets,
    affectedAssets:
      [...robinhoodPrices.affectedAssets],
  };

  switch (robinhoodPrices.status) {
    case "HEALTHY":
      return {
        status: "HEALTHY",
        sources: [source],
        reason:
          "Observed Robinhood price-source requests completed without recorded degradation.",
      };

    case "DEGRADED":
      return {
        status: "DEGRADED",
        sources: [source],
        reason:
          "Robinhood price-source access was usable but experienced recorded degradation.",
      };

    case "UNAVAILABLE":
      return {
        status: "UNAVAILABLE",
        sources: [source],
        reason:
          "Robinhood price-source access was observed but produced no successful asset retrievals.",
      };

    case "UNKNOWN":
      return {
        status: "UNKNOWN",
        sources: [source],
        reason:
          "Robinhood price-source health could not be established from the observed request cycle.",
      };
  }
}


export type MADAssessmentSufficiencyStatus =
  | "SUFFICIENT"
  | "LIMITED"
  | "INSUFFICIENT";

export interface MADAssessmentSufficiency {
  status: MADAssessmentSufficiencyStatus;
  claim:
    | "DISORDERED"
    | "NORMAL";
  reason: string;
}

export function buildAssessmentSufficiency(
  composite: RobinhoodCompositeState,
  coverage: MADAssessmentCoverage,
): MADAssessmentSufficiency {
  const isDisordered =
    composite.mad.disorderScore > 0;

  const activeDisorders =
    composite.mad.activeDisorders;

  /*
   * A directly observed active disorder is enough
   * evidence to support the claim that the subject
   * is disordered, even when unrelated assessment
   * coverage is incomplete.
   *
   * Missing evidence limits what else MAD knows.
   * It does not invalidate a disorder MAD actually
   * observed.
   */
  if (isDisordered) {
    if (activeDisorders.length === 0) {
      return {
        status: "INSUFFICIENT",
        claim: "DISORDERED",
        reason:
          "MAD reports a non-zero disorder score but no active disorder evidence supports that claim.",
      };
    }

    return {
      status: "SUFFICIENT",
      claim: "DISORDERED",
      reason:
        "At least one assessed active disorder directly supports the disordered-state claim.",
    };
  }

  /*
   * A normal-state claim is broader.
   *
   * MAD may only call the available evidence fully
   * sufficient when every applicable supported
   * assessment requirement was covered.
   */
  if (coverage.status === "COMPLETE") {
    return {
      status: "SUFFICIENT",
      claim: "NORMAL",
      reason:
        "All applicable supported disorder assessments were covered and no active disorder was observed.",
    };
  }

  if (coverage.status === "PARTIAL") {
    return {
      status: "LIMITED",
      claim: "NORMAL",
      reason:
        "No active disorder was observed, but incomplete applicable coverage limits the normal-state claim.",
    };
  }

  return {
    status: "INSUFFICIENT",
    claim: "NORMAL",
    reason:
      "Applicable evidence coverage is insufficient to support a normal-state claim.",
  };
}


export type MADAssessmentCoherenceStatus =
  | "COHERENT"
  | "MIXED"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export interface MADAssessmentCoherence {
  status: MADAssessmentCoherenceStatus;
  reason: string;
}

export function buildAssessmentCoherence(
  composite: RobinhoodCompositeState,
  coverage: MADAssessmentCoverage,
): MADAssessmentCoherence {
  /*
   * Coherence is intentionally conservative.
   *
   * MAD must not infer agreement or disagreement
   * between independent signals unless a specific
   * deterministic cross-signal rule exists.
   */

  if (
    coverage.status === "INSUFFICIENT"
  ) {
    return {
      status: "UNKNOWN",
      reason:
        "Assessment coverage is insufficient to evaluate evidence coherence.",
    };
  }

  if (
    composite.disorders.assessed.length < 2
  ) {
    return {
      status: "NOT_APPLICABLE",
      reason:
        "Fewer than two disorder assessments are available for cross-signal coherence evaluation.",
    };
  }

  return {
    status: "NOT_APPLICABLE",
    reason:
      "No deterministic cross-signal coherence rule is currently defined for this assessment.",
  };
}


export type MADAssessmentIntegrityLevel =
  | "STRONG"
  | "ADEQUATE"
  | "LIMITED"
  | "INSUFFICIENT";

export interface MADAssessmentIntegrity {
  level: MADAssessmentIntegrityLevel;

  coverage: MADAssessmentCoverage;
  freshness: MADAssessmentFreshness;
  sourceHealth: MADAssessmentSourceHealth;
  sufficiency: MADAssessmentSufficiency;
  coherence: MADAssessmentCoherence;

  reasons: string[];
}

export function buildAssessmentIntegrity(
  composite: RobinhoodCompositeState,
  capability: RobinhoodAssetCapability,
  robinhoodPrices?:
    RobinhoodPriceSourceHealth,
): MADAssessmentIntegrity {
  const coverage =
    buildAssessmentCoverage(
      composite,
      capability,
    );

  const freshness =
    buildAssessmentFreshness(
      composite,
    );

  const sourceHealth =
    buildAssessmentSourceHealth(
      robinhoodPrices,
    );

  const sufficiency =
    buildAssessmentSufficiency(
      composite,
      coverage,
    );

  const coherence =
    buildAssessmentCoherence(
      composite,
      coverage,
    );

  const reasons: string[] = [];

  /*
   * Hard failure gates.
   *
   * These mean MAD does not have enough epistemic
   * support for the assessment being claimed.
   */
  if (
    coverage.status === "INSUFFICIENT"
  ) {
    reasons.push(
      "Applicable assessment coverage is insufficient.",
    );
  }

  if (
    sufficiency.status ===
    "INSUFFICIENT"
  ) {
    reasons.push(
      "Available evidence is insufficient for the assessment claim.",
    );
  }

  if (
    sourceHealth.status ===
    "UNAVAILABLE"
  ) {
    reasons.push(
      "An observed required source was unavailable.",
    );
  }

  if (reasons.length > 0) {
    return {
      level: "INSUFFICIENT",
      coverage,
      freshness,
      sourceHealth,
      sufficiency,
      coherence,
      reasons,
    };
  }

  /*
   * Material limitations.
   *
   * The assessment remains meaningful, but MAD must
   * explicitly qualify its ability to know.
   */
  if (
    coverage.status === "PARTIAL"
  ) {
    reasons.push(
      "Applicable assessment coverage is partial.",
    );
  }

  if (
    freshness.status === "STALE" ||
    freshness.status === "UNKNOWN"
  ) {
    reasons.push(
      freshness.status === "STALE"
        ? "Assessment evidence includes stale source data."
        : "Assessment evidence freshness could not be established.",
    );
  }

  if (
    sourceHealth.status ===
    "DEGRADED"
  ) {
    reasons.push(
      "Observed source health was degraded.",
    );
  }

  if (
    sufficiency.status ===
    "LIMITED"
  ) {
    reasons.push(
      "Evidence support for the assessment claim is limited.",
    );
  }

  if (
    coherence.status === "MIXED" ||
    coherence.status === "UNKNOWN"
  ) {
    reasons.push(
      coherence.status === "MIXED"
        ? "Observed evidence produced materially mixed signals."
        : "Evidence coherence could not be established.",
    );
  }

  if (reasons.length > 0) {
    return {
      level: "LIMITED",
      coverage,
      freshness,
      sourceHealth,
      sufficiency,
      coherence,
      reasons,
    };
  }

  /*
   * STRONG requires positive operational evidence
   * for source health. UNKNOWN does not imply failure,
   * but it prevents the strongest integrity claim.
   */
  if (
    sourceHealth.status ===
    "UNKNOWN"
  ) {
    return {
      level: "ADEQUATE",
      coverage,
      freshness,
      sourceHealth,
      sufficiency,
      coherence,
      reasons: [
        "Assessment is defensible, but source health was not established for this observation.",
      ],
    };
  }

  return {
    level: "STRONG",
    coverage,
    freshness,
    sourceHealth,
    sufficiency,
    coherence,
    reasons: [],
  };
}
