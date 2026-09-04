import {
  ActiveDisorderId,
  DisorderEvaluation,
  PriceDislocationRuleset,
  PriceObservation,
} from "../domain/types.js";

import { severityFromScore } from "../scoring/severity.js";

export function evaluatePriceDislocation(
  observation: PriceObservation,
  ruleset: PriceDislocationRuleset,
): DisorderEvaluation {
  const { expectedPriceE6, observedPriceE6 } = observation;

  if (expectedPriceE6 <= 0n) {
    throw new Error("Expected price must be greater than zero");
  }

  if (observedPriceE6 < 0n) {
    throw new Error("Observed price cannot be negative");
  }

  const delta = observedPriceE6 - expectedPriceE6;
  const absoluteDelta = delta < 0n ? -delta : delta;

  const deviationBps = Number(
    (absoluteDelta * 10_000n) / expectedPriceE6,
  );

  const direction =
    delta > 0n
      ? "ABOVE"
      : delta < 0n
        ? "BELOW"
        : "FLAT";

  let score = 0;

  for (const band of [...ruleset.scoreBands].sort(
    (a, b) => a.minBps - b.minBps,
  )) {
    if (deviationBps >= band.minBps) {
      score = band.score;
    }
  }

  const active = deviationBps >= ruleset.thresholdBps;

  if (!active) {
    score = 0;
  }

  return {
    disorderId: ActiveDisorderId.PRICE_DISLOCATION,
    active,
    score,
    severity: severityFromScore(score),
    deviationBps,
    direction,
    reason: active
      ? `Price deviation of ${deviationBps} bps exceeds the ${ruleset.thresholdBps} bps MAD threshold`
      : `Price deviation of ${deviationBps} bps remains below the ${ruleset.thresholdBps} bps MAD threshold`,
  };
}
