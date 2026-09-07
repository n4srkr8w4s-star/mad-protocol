import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  buildMADFlightRecord,
  createInMemoryMADFlightRecorder,
  type MADFlightRecord,
} from "../src/engine/madFlightRecorder.js";

import {
  createMADStateTracker,
} from "../src/engine/madStateTracker.js";

import type {
  RobinhoodCompositeState,
} from "../src/engine/diffMADState.js";

function state(
  assetId: string,
  symbol: string,
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
          "1000",
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
      disorderScore: 0,
      severity:
        MADSeverity.NORMAL,
      disorderBitmap: 0n,
      activeDisorders: [],
      assessedDisorders: 0,
      unassessedDisorders: 0,
    },
  } as unknown as RobinhoodCompositeState;
}

describe(
  "MAD Flight Recorder",
  () => {
    it(
      "builds a deterministic record for the first trustworthy observation",
      () => {
        const tracker =
          createMADStateTracker();

        const composite =
          state(
            "aapl-id",
            "AAPL",
          );

        const transition =
          tracker.observe(
            composite,
          );

        const record =
          buildMADFlightRecord(
            composite,
            transition,
            new Date(
              "2026-09-07T01:00:00.000Z",
            ),
          );

        expect(
          record.recordVersion,
        ).toBe(1);

        expect(
          record.recordedAt,
        ).toBe(
          "2026-09-07T01:00:00.000Z",
        );

        expect(
          record.asset,
        ).toEqual({
          symbol: "AAPL",
          assetId: "aapl-id",
        });

        expect(
          record.transition.status,
        ).toBe(
          "BASELINE_ESTABLISHED",
        );

        expect(
          record.transition.diff,
        ).toBeNull();

        expect(
          record.mad.score,
        ).toBe(0);

        expect(
          record.evidence.mad.score,
        ).toBe(0);

        expect(
          record.observations,
        ).toBe(
          composite.observations,
        );
      },
    );

    it(
      "records subsequent observations with their State Diff transition",
      () => {
        const tracker =
          createMADStateTracker();

        const first =
          state(
            "aapl-id",
            "AAPL",
          );

        const second =
          state(
            "aapl-id",
            "AAPL",
          );

        tracker.observe(first);

        const transition =
          tracker.observe(
            second,
          );

        const record =
          buildMADFlightRecord(
            second,
            transition,
            new Date(
              "2026-09-07T01:01:00.000Z",
            ),
          );

        expect(
          record.transition.status,
        ).toBe(
          "DIFF_AVAILABLE",
        );

        expect(
          record.transition.diff,
        ).not.toBeNull();

        expect(
          record.transition.diff?.changed,
        ).toBe(false);
      },
    );

    it(
      "appends every trustworthy observation in chronological insertion order",
      () => {
        const tracker =
          createMADStateTracker();

        const recorder =
          createInMemoryMADFlightRecorder();

        const first =
          state(
            "aapl-id",
            "AAPL",
          );

        const second =
          state(
            "aapl-id",
            "AAPL",
          );

        const firstTransition =
          tracker.observe(
            first,
          );

        recorder.append(
          buildMADFlightRecord(
            first,
            firstTransition,
            new Date(
              "2026-09-07T01:00:00.000Z",
            ),
          ),
        );

        const secondTransition =
          tracker.observe(
            second,
          );

        recorder.append(
          buildMADFlightRecord(
            second,
            secondTransition,
            new Date(
              "2026-09-07T01:01:00.000Z",
            ),
          ),
        );

        const history =
          recorder.history(
            "aapl-id",
          );

        expect(
          history,
        ).toHaveLength(2);

        expect(
          history[0]?.transition.status,
        ).toBe(
          "BASELINE_ESTABLISHED",
        );

        expect(
          history[1]?.transition.status,
        ).toBe(
          "DIFF_AVAILABLE",
        );

        expect(
          recorder.size(),
        ).toBe(2);
      },
    );

    it(
      "maintains isolated histories per asset",
      () => {
        const recorder =
          createInMemoryMADFlightRecorder();

        const aaplTracker =
          createMADStateTracker();

        const nvdaTracker =
          createMADStateTracker();

        const aapl =
          state(
            "aapl-id",
            "AAPL",
          );

        const nvda =
          state(
            "nvda-id",
            "NVDA",
          );

        recorder.append(
          buildMADFlightRecord(
            aapl,
            aaplTracker.observe(
              aapl,
            ),
            new Date(
              "2026-09-07T01:00:00.000Z",
            ),
          ),
        );

        recorder.append(
          buildMADFlightRecord(
            nvda,
            nvdaTracker.observe(
              nvda,
            ),
            new Date(
              "2026-09-07T01:00:00.000Z",
            ),
          ),
        );

        expect(
          recorder.history(
            "aapl-id",
          ),
        ).toHaveLength(1);

        expect(
          recorder.history(
            "nvda-id",
          ),
        ).toHaveLength(1);

        expect(
          recorder.history(
            "aapl-id",
          )[0]?.asset.symbol,
        ).toBe("AAPL");

        expect(
          recorder.history(
            "nvda-id",
          )[0]?.asset.symbol,
        ).toBe("NVDA");
      },
    );

    it(
      "does not expose the recorder's internal history array",
      () => {
        const tracker =
          createMADStateTracker();

        const recorder =
          createInMemoryMADFlightRecorder();

        const composite =
          state(
            "aapl-id",
            "AAPL",
          );

        recorder.append(
          buildMADFlightRecord(
            composite,
            tracker.observe(
              composite,
            ),
            new Date(
              "2026-09-07T01:00:00.000Z",
            ),
          ),
        );

        const externalHistory =
          recorder.history(
            "aapl-id",
          ) as MADFlightRecord[];

        externalHistory.pop();

        expect(
          recorder.history(
            "aapl-id",
          ),
        ).toHaveLength(1);

        expect(
          recorder.size(),
        ).toBe(1);
      },
    );

    it(
      "rejects a transition belonging to a different asset",
      () => {
        const tracker =
          createMADStateTracker();

        const aapl =
          state(
            "aapl-id",
            "AAPL",
          );

        const nvda =
          state(
            "nvda-id",
            "NVDA",
          );

        const nvdaTransition =
          tracker.observe(
            nvda,
          );

        expect(() =>
          buildMADFlightRecord(
            aapl,
            nvdaTransition,
            new Date(
              "2026-09-07T01:00:00.000Z",
            ),
          ),
        ).toThrow(
          "Flight Recorder transition asset does not match composite state asset.",
        );
      },
    );

    it(
      "clears one asset without disturbing other histories",
      () => {
        const recorder =
          createInMemoryMADFlightRecorder();

        const aaplTracker =
          createMADStateTracker();

        const nvdaTracker =
          createMADStateTracker();

        const aapl =
          state(
            "aapl-id",
            "AAPL",
          );

        const nvda =
          state(
            "nvda-id",
            "NVDA",
          );

        recorder.append(
          buildMADFlightRecord(
            aapl,
            aaplTracker.observe(
              aapl,
            ),
            new Date(
              "2026-09-07T01:00:00.000Z",
            ),
          ),
        );

        recorder.append(
          buildMADFlightRecord(
            nvda,
            nvdaTracker.observe(
              nvda,
            ),
            new Date(
              "2026-09-07T01:00:00.000Z",
            ),
          ),
        );

        recorder.clear(
          "aapl-id",
        );

        expect(
          recorder.history(
            "aapl-id",
          ),
        ).toHaveLength(0);

        expect(
          recorder.history(
            "nvda-id",
          ),
        ).toHaveLength(1);

        expect(
          recorder.size(),
        ).toBe(1);
      },
    );
  },
);
