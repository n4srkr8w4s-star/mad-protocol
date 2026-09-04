import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  evaluateHeartbeatReferenceDataStale,
} from "../src/disorders/referenceDataStale.js";

describe(
  "AD-005 published-heartbeat freshness",
  () => {
    it("returns NORMAL when an open-market feed is inside heartbeat", () => {
      const result =
        evaluateHeartbeatReferenceDataStale({
          evaluationTimeUnix:
            1788511240n,

          sourceUpdatedAtUnix:
            1788504295n,

          heartbeatSeconds:
            86400,

          marketAvailability:
            "OPEN",
        });

      expect(
        result.ageSeconds,
      ).toBe(6945);

      expect(
        result.heartbeatBreached,
      ).toBe(false);

      expect(result.active).toBe(false);
      expect(result.score).toBe(0);

      expect(result.severity).toBe(
        MADSeverity.NORMAL,
      );
    });

    it("raises HIGH when an open-market feed exceeds heartbeat", () => {
      const result =
        evaluateHeartbeatReferenceDataStale({
          evaluationTimeUnix:
            100000n,

          sourceUpdatedAtUnix:
            10000n,

          heartbeatSeconds:
            86400,

          marketAvailability:
            "OPEN",
        });

      expect(
        result.ageSeconds,
      ).toBe(90000);

      expect(
        result.heartbeatBreached,
      ).toBe(true);

      expect(result.active).toBe(true);
      expect(result.score).toBe(65);

      expect(result.severity).toBe(
        MADSeverity.HIGH,
      );
    });

    it("does not declare a closed-market feed stale", () => {
      const result =
        evaluateHeartbeatReferenceDataStale({
          evaluationTimeUnix:
            200000n,

          sourceUpdatedAtUnix:
            10000n,

          heartbeatSeconds:
            86400,

          marketAvailability:
            "CLOSED",
        });

      expect(
        result.heartbeatBreached,
      ).toBe(true);

      expect(result.active).toBe(false);
      expect(result.score).toBe(0);

      expect(result.severity).toBe(
        MADSeverity.NORMAL,
      );
    });

    it("refuses to assess unknown market-hours semantics", () => {
      expect(() =>
        evaluateHeartbeatReferenceDataStale({
          evaluationTimeUnix:
            100000n,

          sourceUpdatedAtUnix:
            90000n,

          heartbeatSeconds:
            86400,

          marketAvailability:
            "UNKNOWN",
        }),
      ).toThrow(
        "Cannot assess reference freshness with unknown market-hours semantics",
      );
    });
  },
);
