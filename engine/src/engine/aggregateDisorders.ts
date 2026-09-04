import {
  type ActiveDisorderId,
  type MADSeverity,
} from "../domain/types.js";

import {
  severityFromScore,
} from "../scoring/severity.js";

export interface MADDisorderSignal {
  disorderId: ActiveDisorderId;
  active: boolean;
  score: number;
  severity: MADSeverity;
}

export interface MADCompositeState {
  disorderScore: number;
  severity: MADSeverity;
  disorderBitmap: bigint;

  activeDisorders: Array<{
    disorderId: ActiveDisorderId;
    score: number;
    severity: MADSeverity;
  }>;

  assessedDisorders: number;
}

export function aggregateDisorders(
  signals: MADDisorderSignal[],
): MADCompositeState {
  const seen =
    new Set<number>();

  let disorderScore = 0;
  let disorderBitmap = 0n;

  const activeDisorders:
    MADCompositeState["activeDisorders"] = [];

  for (const signal of signals) {
    if (seen.has(signal.disorderId)) {
      throw new Error(
        `Duplicate disorder evaluation: ${signal.disorderId}`,
      );
    }

    seen.add(signal.disorderId);

    if (
      !Number.isInteger(signal.score) ||
      signal.score < 0 ||
      signal.score > 100
    ) {
      throw new Error(
        `Invalid disorder score: ${signal.score}`,
      );
    }

    if (
      signal.active !==
      (signal.score > 0)
    ) {
      throw new Error(
        `Inconsistent disorder activity for ID ${signal.disorderId}`,
      );
    }

    const expectedSeverity =
      severityFromScore(signal.score);

    if (
      signal.severity !==
      expectedSeverity
    ) {
      throw new Error(
        `Inconsistent disorder severity for ID ${signal.disorderId}`,
      );
    }

    if (!signal.active) {
      continue;
    }

    disorderScore =
      Math.max(
        disorderScore,
        signal.score,
      );

    disorderBitmap |=
      1n <<
      BigInt(signal.disorderId);

    activeDisorders.push({
      disorderId:
        signal.disorderId,

      score:
        signal.score,

      severity:
        signal.severity,
    });
  }

  activeDisorders.sort(
    (a, b) =>
      a.disorderId -
      b.disorderId,
  );

  return {
    disorderScore,

    severity:
      severityFromScore(
        disorderScore,
      ),

    disorderBitmap,

    activeDisorders,

    assessedDisorders:
      signals.length,
  };
}
