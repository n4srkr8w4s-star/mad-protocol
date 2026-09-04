import {
  ActiveDisorderId,
  MADSeverity,
} from "../domain/types.js";

import {
  severityFromScore,
} from "../scoring/severity.js";

export interface OracleDeviationInput {
  underlyingMidpointE6: bigint;
  multiplierE18: bigint;

  oracleAnswer: bigint;
  oracleDecimals: number;
}

export interface OracleDeviationEvaluation {
  disorderId:
    ActiveDisorderId.ORACLE_DEVIATION;

  active: boolean;
  score: number;
  severity: MADSeverity;

  expectedPriceE18: string;
  observedPriceE18: string;

  deviationBps: number;
  direction:
    | "ABOVE"
    | "BELOW"
    | "FLAT";

  reason: string;
}

function oracleToE18(
  answer: bigint,
  decimals: number,
): bigint {
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 18
  ) {
    throw new Error(
      "Oracle decimals must be an integer between 0 and 18",
    );
  }

  return (
    answer *
    10n ** BigInt(18 - decimals)
  );
}

export function evaluateOracleDeviation(
  input: OracleDeviationInput,
): OracleDeviationEvaluation {
  if (input.underlyingMidpointE6 <= 0n) {
    throw new Error(
      "Underlying midpoint must be greater than zero",
    );
  }

  if (input.multiplierE18 <= 0n) {
    throw new Error(
      "Multiplier must be greater than zero",
    );
  }

  if (input.oracleAnswer <= 0n) {
    throw new Error(
      "Oracle answer must be greater than zero",
    );
  }

  const underlyingE18 =
    input.underlyingMidpointE6 *
    10n ** 12n;

  const expectedPriceE18 =
    (
      underlyingE18 *
      input.multiplierE18
    ) /
    10n ** 18n;

  const observedPriceE18 =
    oracleToE18(
      input.oracleAnswer,
      input.oracleDecimals,
    );

  const delta =
    observedPriceE18 >= expectedPriceE18
      ? observedPriceE18 -
        expectedPriceE18
      : expectedPriceE18 -
        observedPriceE18;

  const deviationBps =
    Number(
      (
        delta *
        10_000n
      ) /
      expectedPriceE18,
    );

  const direction =
    observedPriceE18 >
    expectedPriceE18
      ? "ABOVE"
      : observedPriceE18 <
          expectedPriceE18
        ? "BELOW"
        : "FLAT";

  let score = 0;

  if (deviationBps >= 100) {
    score = 80;
  } else if (deviationBps >= 50) {
    score = 65;
  } else if (deviationBps >= 25) {
    score = 40;
  }

  const active = score > 0;

  const reason = active
    ? `Robinhood Chain oracle deviates from the multiplier-adjusted underlying reference by ${deviationBps} bps.`
    : `Robinhood Chain oracle is within the MAD tolerance; deviation is ${deviationBps} bps.`;

  return {
    disorderId:
      ActiveDisorderId.ORACLE_DEVIATION,

    active,
    score,

    severity:
      severityFromScore(score),

    expectedPriceE18:
      expectedPriceE18.toString(),

    observedPriceE18:
      observedPriceE18.toString(),

    deviationBps,
    direction,

    reason,
  };
}
