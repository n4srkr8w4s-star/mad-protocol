import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ActiveDisorderId,
  MADSeverity,
} from "../src/domain/types.js";

import {
  diffMADState,
  type RobinhoodCompositeState,
} from "../src/engine/diffMADState.js";

function state(input: {
  assetId?: string;
  symbol?: string;
  evaluationTimeUnix?: string;
  score?: number;
  severity?: MADSeverity;
  active?: boolean;
  disorderScore?: number;
  disorderSeverity?: MADSeverity;
  assessed?: boolean;
  underlyingMidpointE6?: string;
  oracleAnswerRaw?: string;
  oracleAgeSeconds?: number;
  marketAvailability?: string;
} = {}): RobinhoodCompositeState {
  const disorderId =
    ActiveDisorderId.UNDERLYING_TRADING_HALT;

  const assessed =
    input.assessed ?? true;

  const disorderScore =
    input.disorderScore ?? 0;

  const disorderSeverity =
    input.disorderSeverity ??
    (0 as MADSeverity);

  return {
    asset: {
      symbol: input.symbol ?? "AAPL",
      name: "Apple",
      assetId: input.assetId ?? "aapl-id",
      isin: "US0378331005",
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
          input.underlyingMidpointE6 ??
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
        description: "AAPL / USD",
        price: "100.5",
        answerRaw:
          input.oracleAnswerRaw ??
          "10050000000",
        decimals: 8,
        updatedAt:
          "2026-09-07T00:00:00.000Z",
        heartbeatSeconds: 3600,
        marketHours: "REGULAR",
        marketAvailability:
          input.marketAvailability ??
          "OPEN",
        threshold: null,
      },

      timing: {
        evaluationTimeUnix:
          input.evaluationTimeUnix ??
          "1000",
        robinhoodPriceAgeSeconds: 0,
        oracleAgeSeconds:
          input.oracleAgeSeconds ?? 30,
        sourceSkewSeconds: 0,
      },
    },

    disorders: {
      assessed: assessed
        ? [
            {
              id: disorderId,
              code:
                "UNDERLYING_TRADING_HALT",
              evaluation: {
                disorderId,
                active:
                  input.active ?? false,
                score: disorderScore,
                severity:
                  disorderSeverity,
                reason: "test",
              },
            },
          ]
        : [],

      unassessed: assessed
        ? []
        : [
            {
              id: disorderId,
              code:
                "UNDERLYING_TRADING_HALT",
              reason: "test unassessed",
            },
          ],
    },

    mad: {
      disorderScore:
        input.score ?? disorderScore,
      severity:
        input.severity ??
        disorderSeverity,
      disorderBitmap:
        input.active
          ? 1n << BigInt(disorderId)
          : 0n,
      activeDisorders:
        input.active
          ? [
              {
                disorderId,
                score: disorderScore,
                severity:
                  disorderSeverity,
              },
            ]
          : [],
      assessedDisorders:
        assessed ? 1 : 0,
      unassessedDisorders:
        assessed ? 0 : 1,
    },
  } as unknown as RobinhoodCompositeState;
}

describe("diffMADState", () => {
  it("reports no canonical change for identical state", () => {
    const previous =
      state({
        evaluationTimeUnix: "1000",
        oracleAgeSeconds: 30,
      });

    const current =
      state({
        evaluationTimeUnix: "1060",
        oracleAgeSeconds: 90,
      });

    const diff =
      diffMADState(previous, current);

    expect(diff.changed).toBe(false);
    expect(diff.score.delta).toBe(0);
    expect(
      diff.severity.changed,
    ).toBe(false);

    /*
     * Age remains observable but the clock
     * moving alone is not a MAD transition.
     */
    expect(
      diff.observations
        .oracleFreshnessChanged,
    ).toBe(true);
  });

  it("detects disorder activation", () => {
    const previous =
      state({
        active: false,
        disorderScore: 0,
        severity:
          0 as MADSeverity,
        disorderSeverity:
          0 as MADSeverity,
      });

    const current =
      state({
        active: true,
        score: 50,
        severity:
          2 as MADSeverity,
        disorderScore: 50,
        disorderSeverity:
          2 as MADSeverity,
      });

    const diff =
      diffMADState(previous, current);

    expect(diff.changed).toBe(true);

    expect(
      diff.disorders.activated,
    ).toEqual([
      ActiveDisorderId
        .UNDERLYING_TRADING_HALT,
    ]);

    expect(diff.score.delta).toBe(50);
  });

  it("detects disorder clearance", () => {
    const previous =
      state({
        active: true,
        score: 50,
        severity:
          2 as MADSeverity,
        disorderScore: 50,
        disorderSeverity:
          2 as MADSeverity,
      });

    const current =
      state({
        active: false,
        score: 0,
        severity:
          0 as MADSeverity,
        disorderScore: 0,
        disorderSeverity:
          0 as MADSeverity,
      });

    const diff =
      diffMADState(previous, current);

    expect(diff.changed).toBe(true);

    expect(
      diff.disorders.cleared,
    ).toEqual([
      ActiveDisorderId
        .UNDERLYING_TRADING_HALT,
    ]);

    expect(diff.score.delta).toBe(-50);
  });

  it("detects score and severity movement", () => {
    const previous =
      state({
        active: true,
        score: 25,
        severity:
          1 as MADSeverity,
        disorderScore: 25,
        disorderSeverity:
          1 as MADSeverity,
      });

    const current =
      state({
        active: true,
        score: 75,
        severity:
          3 as MADSeverity,
        disorderScore: 75,
        disorderSeverity:
          3 as MADSeverity,
      });

    const diff =
      diffMADState(previous, current);

    expect(diff.score.delta).toBe(50);

    expect(
      diff.severity.changed,
    ).toBe(true);

    expect(
      diff.disorders.changed,
    ).toHaveLength(1);

    expect(
      diff.disorders.changed[0]
        ?.scoreDelta,
    ).toBe(50);
  });

  it("treats assessment loss as coverage change, not clearance", () => {
    const previous =
      state({
        active: true,
        score: 50,
        severity:
          2 as MADSeverity,
        disorderScore: 50,
        disorderSeverity:
          2 as MADSeverity,
        assessed: true,
      });

    const current =
      state({
        score: 0,
        severity:
          0 as MADSeverity,
        assessed: false,
      });

    const diff =
      diffMADState(previous, current);

    expect(
      diff.assessment.changed,
    ).toBe(true);

    expect(
      diff.disorders.cleared,
    ).toEqual([]);
  });

  it("rejects comparison across different assets", () => {
    expect(() =>
      diffMADState(
        state({
          assetId: "aapl-id",
        }),
        state({
          assetId: "nvda-id",
          symbol: "NVDA",
        }),
      ),
    ).toThrow(
      "MAD State Diff requires states for the same asset.",
    );
  });
});

describe(
  "diffMADState semantic classifications",
  () => {
    it(
      "classifies score and severity movement",
      () => {
        const previous =
          state({
            active: true,
            score: 25,
            severity:
              1 as MADSeverity,
            disorderScore: 25,
            disorderSeverity:
              1 as MADSeverity,
          });

        const current =
          state({
            active: true,
            score: 75,
            severity:
              3 as MADSeverity,
            disorderScore: 75,
            disorderSeverity:
              3 as MADSeverity,
          });

        const diff =
          diffMADState(
            previous,
            current,
          );

        expect(
          diff.changeTypes,
        ).toContain(
          "SCORE_CHANGED",
        );

        expect(
          diff.changeTypes,
        ).toContain(
          "SEVERITY_CHANGED",
        );

        expect(
          diff.changeTypes,
        ).toContain(
          "DISORDER_CHANGED",
        );
      },
    );

    it(
      "classifies disorder activation",
      () => {
        const previous =
          state({
            active: false,
            score: 0,
            severity:
              0 as MADSeverity,
            disorderScore: 0,
            disorderSeverity:
              0 as MADSeverity,
          });

        const current =
          state({
            active: true,
            score: 50,
            severity:
              2 as MADSeverity,
            disorderScore: 50,
            disorderSeverity:
              2 as MADSeverity,
          });

        const diff =
          diffMADState(
            previous,
            current,
          );

        expect(
          diff.changeTypes,
        ).toContain(
          "DISORDER_ACTIVATED",
        );
      },
    );

    it(
      "classifies assessment changes without inventing disorder clearance",
      () => {
        const previous =
          state({
            active: true,
            score: 50,
            severity:
              2 as MADSeverity,
            disorderScore: 50,
            disorderSeverity:
              2 as MADSeverity,
            assessed: true,
          });

        const current =
          state({
            score: 0,
            severity:
              0 as MADSeverity,
            assessed: false,
          });

        const diff =
          diffMADState(
            previous,
            current,
          );

        expect(
          diff.changeTypes,
        ).toContain(
          "ASSESSMENT_CHANGED",
        );

        expect(
          diff.changeTypes,
        ).not.toContain(
          "DISORDER_CLEARED",
        );
      },
    );

    it(
      "does not classify ordinary market price movement as a MAD state change",
      () => {
        const previous =
          state({
            underlyingMidpointE6:
              "100500000",
            oracleAnswerRaw:
              "10050000000",
          });

        const current =
          state({
            underlyingMidpointE6:
              "101000000",
            oracleAnswerRaw:
              "10100000000",
          });

        const diff =
          diffMADState(
            previous,
            current,
          );

        expect(
          diff.observations
            .underlyingMidpointChanged,
        ).toBe(true);

        expect(
          diff.observations
            .oraclePriceChanged,
        ).toBe(true);

        expect(
          diff.changed,
        ).toBe(false);

        expect(
          diff.changeTypes,
        ).toEqual([]);
      },
    );
  },
);
