import {
  MADSeverity,
} from "../domain/types.js";

import type {
  MADCapabilityLevel,
} from "../engine/resolveRobinhoodCapability.js";

import type {
  evaluateRobinhoodCompositeState,
} from "../engine/evaluateRobinhoodCompositeState.js";

import type {
  MADRadarSnapshot,
} from "../engine/buildMADRadar.js";
import type {
  MADEvidenceDNA,
} from "../engine/buildEvidenceDNA.js";

type RobinhoodCompositeState =
  Awaited<
    ReturnType<
      typeof evaluateRobinhoodCompositeState
    >
  >;

export interface RobinhoodCapabilitySummary {
  level: MADCapabilityLevel;
  supportedDisorders: number;
  totalDisorders: number;
}

function severityName(
  severity: MADSeverity,
): string {
  const name =
    MADSeverity[severity];

  return typeof name === "string"
    ? name
    : "UNKNOWN";
}


export function presentMADEvidenceDNA(
  dna: MADEvidenceDNA,
) {
  return {
    asset: {
      symbol:
        dna.asset.symbol,
      assetId:
        dna.asset.assetId,
    },

    mad: {
      score:
        dna.mad.score,
      severityCode:
        dna.mad.severity,
      severity:
        severityName(
          dna.mad.severity,
        ),
      dominantDisorders:
        dna.mad.dominantDisorders,
    },

    disorders:
      dna.disorders.map(
        (disorder) => ({
          id:
            disorder.id,
          code:
            disorder.code,
          status:
            disorder.status,
          score:
            disorder.score,
          severityCode:
            disorder.severity,
          severity:
            disorder.severity === null
              ? null
              : severityName(
                  disorder.severity,
                ),
          reason:
            disorder.reason,
          evidence:
            disorder.evidence,
        }),
      ),
  };
}

export function presentRobinhoodCompositeState(
  composite: RobinhoodCompositeState,
  capability: RobinhoodCapabilitySummary,
) {
  return {
    asset: {
      id:
        composite.asset.symbol.toLowerCase(),
      symbol:
        composite.asset.symbol,
      name:
        composite.asset.name,
      type:
        "ROBINHOOD_STOCK_TOKEN",
      address:
        composite.asset.contractAddress,
      chainId:
        composite.asset.chainId,
      underlyingSymbol:
        composite.asset.symbol,
      robinhoodAssetId:
        composite.asset.assetId,
      isin:
        composite.asset.isin,
      status:
        composite.asset.status,
    },

    /*
     * Structural capability is deliberately
     * separate from current assessment coverage.
     */
    capability: {
      level:
        capability.level,
      supportedDisorders:
        capability.supportedDisorders,
      totalDisorders:
        capability.totalDisorders,
    },

    observations:
      composite.observations,

    disorders: {
      assessed:
        composite.disorders.assessed.map(
          (disorder) => ({
            id:
              disorder.id,
            code:
              disorder.code,
            active:
              disorder.evaluation.active,
            score:
              disorder.evaluation.score,
            severityCode:
              disorder.evaluation.severity,
            severity:
              severityName(
                disorder.evaluation.severity,
              ),
            reason:
              disorder.evaluation.reason,
          }),
        ),

      unassessed:
        composite.disorders.unassessed,
    },

    mad: {
      score:
        composite.mad.disorderScore,
      severityCode:
        composite.mad.severity,
      severity:
        severityName(
          composite.mad.severity,
        ),
      isDisordered:
        composite.mad.disorderScore > 0,
      disorderBitmap:
        composite.mad.disorderBitmap.toString(),

      activeDisorders:
        composite.mad.activeDisorders.map(
          (disorder) => ({
            id:
              disorder.disorderId,
            score:
              disorder.score,
            severityCode:
              disorder.severity,
            severity:
              severityName(
                disorder.severity,
              ),
          }),
        ),

      assessedDisorders:
        composite.mad.assessedDisorders,

      unassessedDisorders:
        composite.mad.unassessedDisorders,
    },
  };
}

function presentMADRadarTransition(
  transition:
    MADRadarSnapshot["assets"][number]["transition"],
) {
  if (!transition) {
    return null;
  }

  if (
    transition.status ===
    "BASELINE_ESTABLISHED"
  ) {
    return {
      status:
        "BASELINE_ESTABLISHED" as const,
      changed: null,
      changeTypes: [],
      scoreDelta: null,
      severity: {
        previous: null,
        current: null,
        changed: false,
      },
      disorders: {
        activated: [],
        cleared: [],
      },
    };
  }

  const diff = transition.diff;

  if (!diff) {
    /*
     * Defensive boundary:
     * DIFF_AVAILABLE should always contain
     * a diff, but never fabricate one.
     */
    return {
      status:
        "DIFF_AVAILABLE" as const,
      changed: null,
      changeTypes: [],
      scoreDelta: null,
      severity: {
        previous: null,
        current: null,
        changed: false,
      },
      disorders: {
        activated: [],
        cleared: [],
      },
    };
  }

  return {
    status:
      "DIFF_AVAILABLE" as const,
    changed:
      diff.changed,
    changeTypes:
      diff.changeTypes,
    scoreDelta:
      diff.score.delta,
    severity: {
      previous:
        diff.severity.previous,
      current:
        diff.severity.current,
      changed:
        diff.severity.changed,
    },
    disorders: {
      activated:
        diff.disorders.activated,
      cleared:
        diff.disorders.cleared,
    },
  };
}

export function presentMADRadarSnapshot(
  snapshot: MADRadarSnapshot,
) {
  return {
    generatedAt:
      snapshot.generatedAt,

    counts:
      snapshot.counts,

    sourceHealth:
      snapshot.sourceHealth,

    assets:
      snapshot.assets.map(
        (asset) => ({
          symbol:
            asset.symbol,
          name:
            asset.name,
          assetId:
            asset.assetId,
          isin:
            asset.isin,
          address:
            asset.address,
          chainId:
            asset.chainId,
          capability:
            asset.capability,
          supportedDisorders:
            asset.supportedDisorders,
          totalDisorders:
            asset.totalDisorders,
          feedResolution:
            asset.feedResolution,
          stateStatus:
            asset.stateStatus,
          state:
            asset.state,

          transition:
            presentMADRadarTransition(
              asset.transition,
            ),

          reason:
            asset.reason,
        }),
      ),
  };
}
