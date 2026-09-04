import { describe, expect, it } from "vitest";

import {
  ActiveDisorderId,
  MADSeverity,
} from "../src/domain/types.js";

import {
  evaluateMultiplierTransition,
} from "../src/disorders/multiplierTransition.js";

const AAPL_MULTIPLIER =
  1000566080061092436n;

describe("AD-004 Multiplier Transition", () => {
  it("returns NORMAL when Robinhood REST and onchain multipliers match", () => {
    const result =
      evaluateMultiplierTransition({
        expectedCurrentE18:
          AAPL_MULTIPLIER,
        observedOnchainE18:
          AAPL_MULTIPLIER,
        pendingE18: null,
      });

    expect(result.disorderId).toBe(
      ActiveDisorderId.MULTIPLIER_TRANSITION,
    );

    expect(
      result.currentMultiplierMatches,
    ).toBe(true);

    expect(result.transitionPending).toBe(
      false,
    );

    expect(result.active).toBe(false);
    expect(result.score).toBe(0);
    expect(result.severity).toBe(
      MADSeverity.NORMAL,
    );
  });

  it("raises AD-004 when Robinhood reports a pending multiplier", () => {
    const result =
      evaluateMultiplierTransition({
        expectedCurrentE18:
          AAPL_MULTIPLIER,
        observedOnchainE18:
          AAPL_MULTIPLIER,
        pendingE18:
          500000000000000000n,
      });

    expect(
      result.currentMultiplierMatches,
    ).toBe(true);

    expect(result.transitionPending).toBe(
      true,
    );

    expect(result.active).toBe(true);
    expect(result.score).toBe(40);
    expect(result.severity).toBe(
      MADSeverity.ELEVATED,
    );
  });

  it("raises HIGH when REST and onchain current multipliers disagree", () => {
    const result =
      evaluateMultiplierTransition({
        expectedCurrentE18:
          AAPL_MULTIPLIER,
        observedOnchainE18:
          1000000000000000000n,
        pendingE18: null,
      });

    expect(
      result.currentMultiplierMatches,
    ).toBe(false);

    expect(result.active).toBe(true);
    expect(result.score).toBe(65);
    expect(result.severity).toBe(
      MADSeverity.HIGH,
    );
  });

  it("gives mismatch priority over a pending transition", () => {
    const result =
      evaluateMultiplierTransition({
        expectedCurrentE18:
          AAPL_MULTIPLIER,
        observedOnchainE18:
          1000000000000000000n,
        pendingE18:
          500000000000000000n,
      });

    expect(result.active).toBe(true);
    expect(result.score).toBe(65);
    expect(result.severity).toBe(
      MADSeverity.HIGH,
    );

    expect(result.transitionPending).toBe(
      true,
    );

    expect(
      result.currentMultiplierMatches,
    ).toBe(false);
  });
});
