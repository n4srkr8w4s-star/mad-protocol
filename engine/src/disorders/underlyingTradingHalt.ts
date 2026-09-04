import {
  ActiveDisorderId,
  MADSeverity,
} from "../domain/types.js";

import {
  severityFromScore,
} from "../scoring/severity.js";

export interface UnderlyingTradingHaltInput {
  isTradingHalt: boolean;
}

export interface UnderlyingTradingHaltEvaluation {
  disorderId:
    ActiveDisorderId.UNDERLYING_TRADING_HALT;

  active: boolean;
  score: number;
  severity: MADSeverity;

  isTradingHalt: boolean;

  reason: string;
}

export function evaluateUnderlyingTradingHalt(
  input: UnderlyingTradingHaltInput,
): UnderlyingTradingHaltEvaluation {
  const score =
    input.isTradingHalt
      ? 80
      : 0;

  return {
    disorderId:
      ActiveDisorderId.UNDERLYING_TRADING_HALT,

    active:
      input.isTradingHalt,

    score,

    severity:
      severityFromScore(score),

    isTradingHalt:
      input.isTradingHalt,

    reason:
      input.isTradingHalt
        ? "Robinhood reports that trading in the underlying asset is halted."
        : "Robinhood reports no trading halt for the underlying asset.",
  };
}
