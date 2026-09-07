import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  createMADStateTracker,
} from "../src/engine/madStateTracker.js";

import type {
  RobinhoodCompositeState,
} from "../src/engine/diffMADState.js";

function state(
  assetId: string,
  symbol: string,
  score = 0,
): RobinhoodCompositeState {
  return {
    asset: {
      symbol,
      name: symbol,
      assetId,
      isin: `${symbol}-ISIN`,
      status: "ACTIVE",
      contractAddress:
        "0x0000000000000000000000000000000000000001",
      chainId: 1,
    },

    observations: {
      underlying: {
        bid: "100",
        ask: "101",
        midpointE6:
          "100500000",
        currency: "USD",
        isTradingHalt: false,
        generatedAt:
          "2026-09-07T00:00:00.000Z",
      },

      multiplier: {
        robinhoodApi: "1",
        robinhoodApiE18:
          "1000000000000000000",
        onchainE18:
          "1000000000000000000",
        pending: null,
      },

      oracle: {
        feedAddress:
          "0x0000000000000000000000000000000000000002",
        description:
          `${symbol} / USD`,
        price: "100.5",
        answerRaw:
          "10050000000",
        decimals: 8,
        updatedAt:
          "2026-09-07T00:00:00.000Z",
        heartbeatSeconds: 3600,
        marketHours: "REGULAR",
        marketAvailability: "OPEN",
        threshold: null,
      },

      timing: {
        evaluationTimeUnix:
          score === 0
            ? "1000"
            : "1060",
        robinhoodPriceAgeSeconds: 0,
        oracleAgeSeconds: 30,
        sourceSkewSeconds: 0,
      },
    },

    disorders: {
      assessed: [],
      unassessed: [],
    },

    mad: {
      disorderScore: score,
      severity:
        (score === 0
          ? 0
          : 1) as MADSeverity,
      disorderBitmap: 0n,
      activeDisorders: [],
      assessedDisorders: 0,
      unassessedDisorders: 0,
    },
  } as unknown as RobinhoodCompositeState;
}

describe(
  "MAD State Tracker",
  () => {
    it(
      "establishes a baseline on first observation",
      () => {
        const tracker =
          createMADStateTracker();

        const first =
          state(
            "aapl-id",
            "AAPL",
          );

        const result =
          tracker.observe(first);

        expect(
          result.status,
        ).toBe(
          "BASELINE_ESTABLISHED",
        );

        expect(
          result.diff,
        ).toBeNull();

        expect(
          tracker.getBaseline(
            "aapl-id",
          ),
        ).toBe(first);

        expect(
          tracker.size(),
        ).toBe(1);
      },
    );

    it(
      "returns a diff for the second successful observation",
      () => {
        const tracker =
          createMADStateTracker();

        tracker.observe(
          state(
            "aapl-id",
            "AAPL",
            0,
          ),
        );

        const current =
          state(
            "aapl-id",
            "AAPL",
            25,
          );

        const result =
          tracker.observe(
            current,
          );

        expect(
          result.status,
        ).toBe(
          "DIFF_AVAILABLE",
        );

        expect(
          result.diff,
        ).not.toBeNull();

        expect(
          result.diff?.score.delta,
        ).toBe(25);

        expect(
          tracker.getBaseline(
            "aapl-id",
          ),
        ).toBe(current);
      },
    );

    it(
      "maintains independent baselines per asset",
      () => {
        const tracker =
          createMADStateTracker();

        tracker.observe(
          state(
            "aapl-id",
            "AAPL",
          ),
        );

        tracker.observe(
          state(
            "nvda-id",
            "NVDA",
          ),
        );

        expect(
          tracker.size(),
        ).toBe(2);

        expect(
          tracker.getBaseline(
            "aapl-id",
          )?.asset.symbol,
        ).toBe("AAPL");

        expect(
          tracker.getBaseline(
            "nvda-id",
          )?.asset.symbol,
        ).toBe("NVDA");
      },
    );

    it(
      "advances the baseline after a successful comparison",
      () => {
        const tracker =
          createMADStateTracker();

        const first =
          state(
            "aapl-id",
            "AAPL",
            0,
          );

        const second =
          state(
            "aapl-id",
            "AAPL",
            25,
          );

        const third =
          state(
            "aapl-id",
            "AAPL",
            50,
          );

        tracker.observe(first);

        const firstDiff =
          tracker.observe(
            second,
          );

        const secondDiff =
          tracker.observe(
            third,
          );

        expect(
          firstDiff.diff?.score.delta,
        ).toBe(25);

        expect(
          secondDiff.diff?.score.delta,
        ).toBe(25);

        expect(
          tracker.getBaseline(
            "aapl-id",
          ),
        ).toBe(third);
      },
    );

    it(
      "can restore a persisted baseline before observing",
      () => {
        const tracker =
          createMADStateTracker();

        tracker.restoreBaseline(
          state(
            "aapl-id",
            "AAPL",
            25,
          ),
        );

        const result =
          tracker.observe(
            state(
              "aapl-id",
              "AAPL",
              50,
            ),
          );

        expect(
          result.status,
        ).toBe(
          "DIFF_AVAILABLE",
        );

        expect(
          result.diff?.score.delta,
        ).toBe(25);
      },
    );

    it(
      "can clear one asset without clearing others",
      () => {
        const tracker =
          createMADStateTracker();

        tracker.observe(
          state(
            "aapl-id",
            "AAPL",
          ),
        );

        tracker.observe(
          state(
            "nvda-id",
            "NVDA",
          ),
        );

        tracker.clear(
          "aapl-id",
        );

        expect(
          tracker.getBaseline(
            "aapl-id",
          ),
        ).toBeUndefined();

        expect(
          tracker.getBaseline(
            "nvda-id",
          ),
        ).toBeDefined();

        expect(
          tracker.size(),
        ).toBe(1);
      },
    );

    it(
      "can clear every baseline",
      () => {
        const tracker =
          createMADStateTracker();

        tracker.observe(
          state(
            "aapl-id",
            "AAPL",
          ),
        );

        tracker.observe(
          state(
            "nvda-id",
            "NVDA",
          ),
        );

        tracker.clear();

        expect(
          tracker.size(),
        ).toBe(0);
      },
    );
  },
);
