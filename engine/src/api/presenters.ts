import {
  MADSeverity,
} from "../domain/types.js";

import type {
  MADCapabilityLevel,
} from "../engine/resolveRobinhoodCapability.js";

import type {
  evaluateRobinhoodCompositeState,
} from "../engine/evaluateRobinhoodCompositeState.js";

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
