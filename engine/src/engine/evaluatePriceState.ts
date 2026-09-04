import {
  ActiveDisorderId,
  type AssetContext,
  type PriceObservation,
} from "../domain/types.js";

import { evaluatePriceDislocation } from "../disorders/priceDislocation.js";
import { buildPriceDislocationEvidence } from "../evidence/priceDislocationEvidence.js";
import { loadPriceDislocationRuleset } from "../rulesets/loadPriceDislocationRuleset.js";
import type { RegistryUpdatePayload } from "../publish/types.js";

export interface MADPriceState {
  asset: AssetContext;

  observation: {
    expectedPriceE6: bigint;
    observedPriceE6: bigint;
    deviationBps: number;
    direction: "ABOVE" | "BELOW" | "FLAT";
  };

  state: {
    disorderScore: number;
    severity: number;
    disorderBitmap: bigint;
    activeDisorders: ActiveDisorderId[];
  };

  provenance: {
    evidenceHash: `0x${string}`;
    rulesetHash: `0x${string}`;
    rulesetId: string;
  };

  registryUpdate: RegistryUpdatePayload;

  evidence: {
    json: string;
  };
}

export function evaluatePriceState(
  asset: AssetContext,
  observation: PriceObservation,
): MADPriceState {
  const loadedRuleset = loadPriceDislocationRuleset();

  const evaluation = evaluatePriceDislocation(
    observation,
    loadedRuleset.ruleset,
  );

  const evidence = buildPriceDislocationEvidence(
    asset,
    observation,
    evaluation,
  );

  const disorderBitmap = evaluation.active
    ? 1n << BigInt(evaluation.disorderId)
    : 0n;

  const activeDisorders = evaluation.active
    ? [evaluation.disorderId]
    : [];

  return {
    asset,

    observation: {
      expectedPriceE6: observation.expectedPriceE6,
      observedPriceE6: observation.observedPriceE6,
      deviationBps: evaluation.deviationBps,
      direction: evaluation.direction,
    },

    state: {
      disorderScore: evaluation.score,
      severity: evaluation.severity,
      disorderBitmap,
      activeDisorders,
    },

    provenance: {
      evidenceHash: evidence.hash,
      rulesetHash: loadedRuleset.hash,
      rulesetId: loadedRuleset.ruleset.id,
    },

    registryUpdate: {
      asset: asset.assetAddress,
      disorderScore: evaluation.score,
      disorderBitmap,
      evidenceHash: evidence.hash,
      rulesetHash: loadedRuleset.hash,
    },

    evidence: {
      json: evidence.json,
    },
  };
}
