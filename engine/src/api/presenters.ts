import type {
  MADAssetDefinition,
} from "../assets/catalog.js";

import {
  MADSeverity,
} from "../domain/types.js";

import type {
  evaluateRobinhoodCompositeState,
} from "../engine/evaluateRobinhoodCompositeState.js";

type RobinhoodCompositeState =
  Awaited<
    ReturnType<
      typeof evaluateRobinhoodCompositeState
    >
  >;

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
  asset: MADAssetDefinition,
  composite: RobinhoodCompositeState,
) {
  return {
    asset: {
      id: asset.id,
      symbol: composite.asset.symbol,
      name: composite.asset.name,
      type: asset.type,

      address:
        composite.asset.contractAddress,

      chainId:
        composite.asset.chainId,

      underlyingSymbol:
        asset.underlyingSymbol ?? null,

      robinhoodAssetId:
        composite.asset.assetId,

      isin:
        composite.asset.isin,

      status:
        composite.asset.status,
    },

    observations:
      composite.observations,

    disorders: {
      assessed:
        composite.disorders.assessed.map(
          (disorder) => ({
            id: disorder.id,
            code: disorder.code,

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
