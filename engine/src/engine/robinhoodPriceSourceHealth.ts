import type {
  RobinhoodPriceRetryEvent,
} from "./retryingRobinhoodPriceLookup.js";

export type MADSourceHealthStatus =
  | "UNKNOWN"
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE";

export interface RobinhoodPriceSourceHealth {
  source:
    "ROBINHOOD_PRICES";

  status:
    MADSourceHealthStatus;

  assetsRequested: number;

  successfulAssets: number;

  failedAssets: number;

  requestAttempts: number;

  rateLimitEvents: number;

  recoveredAssets: number;

  affectedAssets: string[];
}

export function buildRobinhoodPriceSourceHealth(
  events:
    readonly RobinhoodPriceRetryEvent[],
): RobinhoodPriceSourceHealth {
  const requested =
    new Set<string>();

  const successful =
    new Set<string>();

  const failed =
    new Set<string>();

  const recovered =
    new Set<string>();

  const affected =
    new Set<string>();

  let requestAttempts = 0;
  let rateLimitEvents = 0;

  for (const event of events) {
    switch (event.type) {
      case "ATTEMPT_STARTED": {
        requestAttempts += 1;

        requested.add(
          event.symbol,
        );

        break;
      }

      case "RATE_LIMITED": {
        rateLimitEvents += 1;

        affected.add(
          event.symbol,
        );

        break;
      }

      case "SUCCEEDED": {
        successful.add(
          event.symbol,
        );

        if (
          event.recoveredFromRateLimit
        ) {
          recovered.add(
            event.symbol,
          );

          affected.add(
            event.symbol,
          );
        }

        break;
      }

      case "EXHAUSTED": {
        failed.add(
          event.symbol,
        );

        affected.add(
          event.symbol,
        );

        break;
      }

      case "NON_RETRYABLE_FAILURE": {
        failed.add(
          event.symbol,
        );

        affected.add(
          event.symbol,
        );

        break;
      }
    }
  }

  let status:
    MADSourceHealthStatus;

  if (
    requested.size === 0
  ) {
    status =
      "UNKNOWN";
  } else if (
    successful.size === 0
  ) {
    status =
      "UNAVAILABLE";
  } else if (
    affected.size > 0
  ) {
    status =
      "DEGRADED";
  } else {
    status =
      "HEALTHY";
  }

  return {
    source:
      "ROBINHOOD_PRICES",

    status,

    assetsRequested:
      requested.size,

    successfulAssets:
      successful.size,

    failedAssets:
      failed.size,

    requestAttempts,

    rateLimitEvents,

    recoveredAssets:
      recovered.size,

    affectedAssets:
      [...affected].sort(),
  };
}
