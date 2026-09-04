import {
  ActiveDisorderId,
  MADSeverity,
} from "../domain/types.js";

import { severityFromScore } from "../scoring/severity.js";

export interface MultiplierTransitionInput {
  expectedCurrentE18: bigint;
  observedOnchainE18: bigint;
  pendingE18: bigint | null;
}

export interface MultiplierTransitionEvaluation {
  disorderId:
    ActiveDisorderId.MULTIPLIER_TRANSITION;

  active: boolean;
  score: number;
  severity: MADSeverity;

  currentMultiplierMatches: boolean;
  transitionPending: boolean;

  expectedCurrentE18: string;
  observedOnchainE18: string;
  pendingE18: string | null;

  reason: string;
}

export function evaluateMultiplierTransition(
  input: MultiplierTransitionInput,
): MultiplierTransitionEvaluation {
  if (input.expectedCurrentE18 <= 0n) {
    throw new Error(
      "Expected multiplier must be greater than zero",
    );
  }

  if (input.observedOnchainE18 <= 0n) {
    throw new Error(
      "Observed onchain multiplier must be greater than zero",
    );
  }

  if (
    input.pendingE18 !== null &&
    input.pendingE18 <= 0n
  ) {
    throw new Error(
      "Pending multiplier must be greater than zero",
    );
  }

  const currentMultiplierMatches =
    input.expectedCurrentE18 ===
    input.observedOnchainE18;

  const transitionPending =
    input.pendingE18 !== null;

  let score = 0;
  let reason =
    "Robinhood REST and onchain multipliers match; no multiplier transition is pending.";

  if (!currentMultiplierMatches) {
    score = 65;
    reason =
      "Robinhood REST current multiplier does not match the onchain Stock Token uiMultiplier.";
  } else if (transitionPending) {
    score = 40;
    reason =
      "Robinhood reports a pending Stock Token multiplier transition.";
  }

  return {
    disorderId:
      ActiveDisorderId.MULTIPLIER_TRANSITION,

    active: score > 0,
    score,
    severity: severityFromScore(score),

    currentMultiplierMatches,
    transitionPending,

    expectedCurrentE18:
      input.expectedCurrentE18.toString(),

    observedOnchainE18:
      input.observedOnchainE18.toString(),

    pendingE18:
      input.pendingE18?.toString() ?? null,

    reason,
  };
}
