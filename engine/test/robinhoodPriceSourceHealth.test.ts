import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildRobinhoodPriceSourceHealth,
} from "../src/engine/robinhoodPriceSourceHealth.js";

import type {
  RobinhoodPriceRetryEvent,
} from "../src/engine/retryingRobinhoodPriceLookup.js";

describe(
  "Robinhood price source health",
  () => {
    it(
      "returns UNKNOWN when no observations were attempted",
      () => {
        const result =
          buildRobinhoodPriceSourceHealth(
            [],
          );

        expect(
          result,
        ).toEqual({
          source:
            "ROBINHOOD_PRICES",

          status:
            "UNKNOWN",

          assetsRequested: 0,

          successfulAssets: 0,

          failedAssets: 0,

          requestAttempts: 0,

          rateLimitEvents: 0,

          recoveredAssets: 0,

          affectedAssets: [],
        });
      },
    );

    it(
      "returns HEALTHY when all assets succeed without source pressure",
      () => {
        const events:
          RobinhoodPriceRetryEvent[] =
          [
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "AAPL",
              attempt: 1,
              maxAttempts: 3,
            },
            {
              type:
                "SUCCEEDED",
              symbol: "AAPL",
              attempts: 1,
              recoveredFromRateLimit:
                false,
            },
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "NVDA",
              attempt: 1,
              maxAttempts: 3,
            },
            {
              type:
                "SUCCEEDED",
              symbol: "NVDA",
              attempts: 1,
              recoveredFromRateLimit:
                false,
            },
          ];

        const result =
          buildRobinhoodPriceSourceHealth(
            events,
          );

        expect(
          result,
        ).toMatchObject({
          status:
            "HEALTHY",

          assetsRequested: 2,

          successfulAssets: 2,

          failedAssets: 0,

          requestAttempts: 2,

          rateLimitEvents: 0,

          recoveredAssets: 0,

          affectedAssets: [],
        });
      },
    );

    it(
      "returns DEGRADED when rate limiting is recovered",
      () => {
        const events:
          RobinhoodPriceRetryEvent[] =
          [
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "AAPL",
              attempt: 1,
              maxAttempts: 3,
            },
            {
              type:
                "RATE_LIMITED",
              symbol: "AAPL",
              attempt: 1,
              maxAttempts: 3,
              responseBody:
                "local_rate_limited",
            },
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "AAPL",
              attempt: 2,
              maxAttempts: 3,
            },
            {
              type:
                "SUCCEEDED",
              symbol: "AAPL",
              attempts: 2,
              recoveredFromRateLimit:
                true,
            },
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "NVDA",
              attempt: 1,
              maxAttempts: 3,
            },
            {
              type:
                "SUCCEEDED",
              symbol: "NVDA",
              attempts: 1,
              recoveredFromRateLimit:
                false,
            },
          ];

        const result =
          buildRobinhoodPriceSourceHealth(
            events,
          );

        expect(
          result,
        ).toMatchObject({
          status:
            "DEGRADED",

          assetsRequested: 2,

          successfulAssets: 2,

          failedAssets: 0,

          requestAttempts: 3,

          rateLimitEvents: 1,

          recoveredAssets: 1,

          affectedAssets: [
            "AAPL",
          ],
        });
      },
    );

    it(
      "returns DEGRADED when some assets succeed and another fails",
      () => {
        const events:
          RobinhoodPriceRetryEvent[] =
          [
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "AAPL",
              attempt: 1,
              maxAttempts: 3,
            },
            {
              type:
                "SUCCEEDED",
              symbol: "AAPL",
              attempts: 1,
              recoveredFromRateLimit:
                false,
            },
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "NVDA",
              attempt: 1,
              maxAttempts: 3,
            },
            {
              type:
                "NON_RETRYABLE_FAILURE",
              symbol: "NVDA",
              attempt: 1,
              status: 503,
            },
          ];

        const result =
          buildRobinhoodPriceSourceHealth(
            events,
          );

        expect(
          result,
        ).toMatchObject({
          status:
            "DEGRADED",

          successfulAssets: 1,

          failedAssets: 1,

          affectedAssets: [
            "NVDA",
          ],
        });
      },
    );

    it(
      "returns UNAVAILABLE when every requested asset ultimately fails",
      () => {
        const events:
          RobinhoodPriceRetryEvent[] =
          [
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "AAPL",
              attempt: 1,
              maxAttempts: 2,
            },
            {
              type:
                "RATE_LIMITED",
              symbol: "AAPL",
              attempt: 1,
              maxAttempts: 2,
              responseBody:
                "local_rate_limited",
            },
            {
              type:
                "ATTEMPT_STARTED",
              symbol: "AAPL",
              attempt: 2,
              maxAttempts: 2,
            },
            {
              type:
                "RATE_LIMITED",
              symbol: "AAPL",
              attempt: 2,
              maxAttempts: 2,
              responseBody:
                "local_rate_limited",
            },
            {
              type:
                "EXHAUSTED",
              symbol: "AAPL",
              attempts: 2,
              status: 429,
              responseBody:
                "local_rate_limited",
            },
          ];

        const result =
          buildRobinhoodPriceSourceHealth(
            events,
          );

        expect(
          result,
        ).toMatchObject({
          status:
            "UNAVAILABLE",

          assetsRequested: 1,

          successfulAssets: 0,

          failedAssets: 1,

          requestAttempts: 2,

          rateLimitEvents: 2,

          recoveredAssets: 0,

          affectedAssets: [
            "AAPL",
          ],
        });
      },
    );
  },
);
