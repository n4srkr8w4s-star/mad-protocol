import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  evaluateOracleDeviation,
} from "../src/disorders/oracleDeviation.js";

describe(
  "AD-007 Oracle Deviation",
  () => {
    it("reports the observed AAPL state as NORMAL", () => {
      const result =
        evaluateOracleDeviation({
          underlyingMidpointE6:
            326930000n,

          multiplierE18:
            1000566080061092436n,

          oracleAnswer:
            32707004308n,

          oracleDecimals: 8,
        });

      expect(
        result.active,
      ).toBe(false);

      expect(
        result.score,
      ).toBe(0);

      expect(
        result.severity,
      ).toBe(
        MADSeverity.NORMAL,
      );

      expect(
        result.deviationBps,
      ).toBeLessThan(25);
    });

    it("raises ELEVATED at 25 bps or more", () => {
      const result =
        evaluateOracleDeviation({
          underlyingMidpointE6:
            100000000n,

          multiplierE18:
            1000000000000000000n,

          oracleAnswer:
            10025000000n,

          oracleDecimals: 8,
        });

      expect(
        result.deviationBps,
      ).toBe(25);

      expect(
        result.score,
      ).toBe(40);

      expect(
        result.severity,
      ).toBe(
        MADSeverity.ELEVATED,
      );
    });

    it("raises HIGH at 50 bps or more", () => {
      const result =
        evaluateOracleDeviation({
          underlyingMidpointE6:
            100000000n,

          multiplierE18:
            1000000000000000000n,

          oracleAnswer:
            9950000000n,

          oracleDecimals: 8,
        });

      expect(
        result.deviationBps,
      ).toBe(50);

      expect(
        result.direction,
      ).toBe("BELOW");

      expect(
        result.score,
      ).toBe(65);

      expect(
        result.severity,
      ).toBe(
        MADSeverity.HIGH,
      );
    });

    it("raises CRITICAL at 100 bps or more", () => {
      const result =
        evaluateOracleDeviation({
          underlyingMidpointE6:
            100000000n,

          multiplierE18:
            1000000000000000000n,

          oracleAnswer:
            10100000000n,

          oracleDecimals: 8,
        });

      expect(
        result.deviationBps,
      ).toBe(100);

      expect(
        result.score,
      ).toBe(80);

      expect(
        result.severity,
      ).toBe(
        MADSeverity.CRITICAL,
      );
    });
  },
);
