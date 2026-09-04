import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  evaluateReferenceDataStale,
} from "../src/disorders/referenceDataStale.js";

const POLICY = {
  watchAfterSeconds: 60,
  elevatedAfterSeconds: 300,
  highAfterSeconds: 900,
  criticalAfterSeconds: 3600,
};

describe(
  "AD-005 Reference Data Stale",
  () => {
    it("returns NORMAL when source age is within tolerance", () => {
      const result =
        evaluateReferenceDataStale({
          evaluationTimeUnix: 1000n,
          sourceUpdatedAtUnix: 950n,
          policy: POLICY,
        });

      expect(result.ageSeconds).toBe(50);
      expect(result.active).toBe(false);
      expect(result.score).toBe(0);

      expect(result.severity).toBe(
        MADSeverity.NORMAL,
      );
    });

    it("raises WATCH at the watch boundary", () => {
      const result =
        evaluateReferenceDataStale({
          evaluationTimeUnix: 1000n,
          sourceUpdatedAtUnix: 940n,
          policy: POLICY,
        });

      expect(result.ageSeconds).toBe(60);
      expect(result.score).toBe(20);

      expect(result.severity).toBe(
        MADSeverity.WATCH,
      );
    });

    it("raises ELEVATED at the elevated boundary", () => {
      const result =
        evaluateReferenceDataStale({
          evaluationTimeUnix: 1000n,
          sourceUpdatedAtUnix: 700n,
          policy: POLICY,
        });

      expect(result.ageSeconds).toBe(300);
      expect(result.score).toBe(40);

      expect(result.severity).toBe(
        MADSeverity.ELEVATED,
      );
    });

    it("raises HIGH at the high boundary", () => {
      const result =
        evaluateReferenceDataStale({
          evaluationTimeUnix: 2000n,
          sourceUpdatedAtUnix: 1100n,
          policy: POLICY,
        });

      expect(result.ageSeconds).toBe(900);
      expect(result.score).toBe(65);

      expect(result.severity).toBe(
        MADSeverity.HIGH,
      );
    });

    it("raises CRITICAL at the critical boundary", () => {
      const result =
        evaluateReferenceDataStale({
          evaluationTimeUnix: 5000n,
          sourceUpdatedAtUnix: 1400n,
          policy: POLICY,
        });

      expect(result.ageSeconds).toBe(3600);
      expect(result.score).toBe(80);

      expect(result.severity).toBe(
        MADSeverity.CRITICAL,
      );
    });

    it("rejects a source timestamp from the future", () => {
      expect(() =>
        evaluateReferenceDataStale({
          evaluationTimeUnix: 1000n,
          sourceUpdatedAtUnix: 1001n,
          policy: POLICY,
        }),
      ).toThrow(
        "Source timestamp cannot be later than evaluation time",
      );
    });

    it("rejects invalid policy ordering", () => {
      expect(() =>
        evaluateReferenceDataStale({
          evaluationTimeUnix: 1000n,
          sourceUpdatedAtUnix: 900n,
          policy: {
            watchAfterSeconds: 60,
            elevatedAfterSeconds: 60,
            highAfterSeconds: 900,
            criticalAfterSeconds: 3600,
          },
        }),
      ).toThrow(
        "Invalid reference freshness policy thresholds",
      );
    });
  },
);
