export interface SourceTimingObservation {
  evaluationTimeUnix: string;

  robinhoodPriceGeneratedAtUnix: string;
  oracleUpdatedAtUnix: string;

  robinhoodPriceAgeSeconds: number;
  oracleAgeSeconds: number;

  sourceSkewSeconds: number;
}

export function isoToUnixSeconds(
  value: string,
): bigint {
  const milliseconds = Date.parse(value);

  if (!Number.isFinite(milliseconds)) {
    throw new Error(
      `Invalid ISO timestamp: ${value}`,
    );
  }

  return BigInt(
    Math.floor(milliseconds / 1000),
  );
}

export function observeSourceTiming(input: {
  evaluationTimeUnix: bigint;
  robinhoodPriceGeneratedAt: string;
  oracleUpdatedAtUnix: bigint;
}): SourceTimingObservation {
  if (input.evaluationTimeUnix <= 0n) {
    throw new Error(
      "Evaluation time must be greater than zero",
    );
  }

  if (input.oracleUpdatedAtUnix <= 0n) {
    throw new Error(
      "Oracle update time must be greater than zero",
    );
  }

  const robinhoodPriceGeneratedAtUnix =
    isoToUnixSeconds(
      input.robinhoodPriceGeneratedAt,
    );

  if (
    robinhoodPriceGeneratedAtUnix >
      input.evaluationTimeUnix ||
    input.oracleUpdatedAtUnix >
      input.evaluationTimeUnix
  ) {
    throw new Error(
      "Source timestamp cannot be later than evaluation time",
    );
  }

  const robinhoodPriceAge =
    input.evaluationTimeUnix -
    robinhoodPriceGeneratedAtUnix;

  const oracleAge =
    input.evaluationTimeUnix -
    input.oracleUpdatedAtUnix;

  const skew =
    robinhoodPriceGeneratedAtUnix >=
    input.oracleUpdatedAtUnix
      ? robinhoodPriceGeneratedAtUnix -
        input.oracleUpdatedAtUnix
      : input.oracleUpdatedAtUnix -
        robinhoodPriceGeneratedAtUnix;

  return {
    evaluationTimeUnix:
      input.evaluationTimeUnix.toString(),

    robinhoodPriceGeneratedAtUnix:
      robinhoodPriceGeneratedAtUnix.toString(),

    oracleUpdatedAtUnix:
      input.oracleUpdatedAtUnix.toString(),

    robinhoodPriceAgeSeconds:
      Number(robinhoodPriceAge),

    oracleAgeSeconds:
      Number(oracleAge),

    sourceSkewSeconds:
      Number(skew),
  };
}
