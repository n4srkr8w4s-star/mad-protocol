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
  evaluateUnderlyingTradingHalt,
} from "../src/disorders/underlyingTradingHalt.js";

describe(
  "AD-002 Underlying Trading Halt",
  () => {
    it("returns NORMAL when Robinhood reports no halt", () => {
      const result =
        evaluateUnderlyingTradingHalt({
          isTradingHalt: false,
        });

      expect(result.disorderId).toBe(
        ActiveDisorderId.UNDERLYING_TRADING_HALT,
      );

      expect(result.active).toBe(false);
      expect(result.score).toBe(0);

      expect(result.severity).toBe(
        MADSeverity.NORMAL,
      );
    });

    it("raises CRITICAL when Robinhood reports a trading halt", () => {
      const result =
        evaluateUnderlyingTradingHalt({
          isTradingHalt: true,
        });

      expect(result.active).toBe(true);
      expect(result.score).toBe(80);

      expect(result.severity).toBe(
        MADSeverity.CRITICAL,
      );
    });
  },
);
