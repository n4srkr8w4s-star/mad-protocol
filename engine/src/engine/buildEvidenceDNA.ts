import {
  ActiveDisorderId,
  type MADSeverity,
} from "../domain/types.js";

import type {
  evaluateRobinhoodCompositeState,
} from "./evaluateRobinhoodCompositeState.js";

type RobinhoodCompositeState =
  Awaited<
    ReturnType<
      typeof evaluateRobinhoodCompositeState
    >
  >;

export type MADEvidenceDNAStatus =
  | "DOMINANT"
  | "ACTIVE"
  | "INACTIVE"
  | "UNASSESSED";

export type MADEvidenceValue =
  | string
  | number
  | boolean
  | null;

export interface MADEvidenceDNAFact {
  key: string;
  value: MADEvidenceValue;
}

export interface MADEvidenceDNADisorder {
  id: ActiveDisorderId;
  code: string;
  status: MADEvidenceDNAStatus;
  score: number | null;
  severity: MADSeverity | null;
  reason: string;
  evidence: MADEvidenceDNAFact[];
}

export interface MADEvidenceDNA {
  asset: {
    symbol: string;
    assetId: string;
  };

  mad: {
    score: number;
    severity: MADSeverity;
    dominantDisorders:
      ActiveDisorderId[];
  };

  disorders:
    MADEvidenceDNADisorder[];
}

function evidenceKeysFor(
  disorderId: ActiveDisorderId,
): string[] {
  switch (disorderId) {
    case ActiveDisorderId
      .UNDERLYING_TRADING_HALT:
      return [
        "isTradingHalt",
      ];

    case ActiveDisorderId
      .MULTIPLIER_TRANSITION:
      return [
        "currentMultiplierMatches",
        "transitionPending",
        "expectedCurrentE18",
        "observedOnchainE18",
        "pendingE18",
      ];

    case ActiveDisorderId
      .REFERENCE_DATA_STALE:
      return [
        "ageSeconds",
        "heartbeatSeconds",
        "heartbeatBreached",
        "marketAvailability",
      ];

    case ActiveDisorderId
      .ORACLE_DEVIATION:
      return [
        "expectedPriceE18",
        "observedPriceE18",
        "deviationBps",
        "direction",
      ];

    default:
      return [];
  }
}

function extractEvidence(
  disorderId: ActiveDisorderId,
  evaluation: object,
): MADEvidenceDNAFact[] {
  const record =
    evaluation as Record<
      string,
      unknown
    >;

  return evidenceKeysFor(
    disorderId,
  ).flatMap((key) => {
    const value =
      record[key];

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      return [
        {
          key,
          value,
        },
      ];
    }

    return [];
  });
}

export function buildEvidenceDNA(
  composite: RobinhoodCompositeState,
): MADEvidenceDNA {
  const dominantDisorders =
    composite.mad.activeDisorders
      .filter(
        (disorder) =>
          disorder.score ===
          composite.mad.disorderScore,
      )
      .map(
        (disorder) =>
          disorder.disorderId,
      );

  const dominant =
    new Set<number>(
      dominantDisorders,
    );

  const assessed:
    MADEvidenceDNADisorder[] =
    composite.disorders.assessed.map(
      (disorder) => {
        const evaluation =
          disorder.evaluation;

        const status:
          MADEvidenceDNAStatus =
          !evaluation.active
            ? "INACTIVE"
            : dominant.has(
                  disorder.id,
                )
              ? "DOMINANT"
              : "ACTIVE";

        return {
          id:
            disorder.id,
          code:
            disorder.code,
          status,
          score:
            evaluation.score,
          severity:
            evaluation.severity,
          reason:
            evaluation.reason,
          evidence:
            extractEvidence(
              disorder.id,
              evaluation,
            ),
        };
      },
    );

  const unassessed:
    MADEvidenceDNADisorder[] =
    composite.disorders.unassessed.map(
      (disorder) => ({
        id:
          disorder.id,
        code:
          disorder.code,
        status:
          "UNASSESSED",
        score:
          null,
        severity:
          null,
        reason:
          disorder.reason,
        evidence: [],
      }),
    );

  return {
    asset: {
      symbol:
        composite.asset.symbol,
      assetId:
        composite.asset.assetId,
    },

    mad: {
      score:
        composite.mad.disorderScore,
      severity:
        composite.mad.severity,
      dominantDisorders,
    },

    disorders: [
      ...assessed,
      ...unassessed,
    ],
  };
}
