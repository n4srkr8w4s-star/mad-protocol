import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isoToUnixSeconds,
  observeSourceTiming,
} from "../src/engine/sourceTiming.js";

describe("MAD source timing", () => {
  it("parses Robinhood nanosecond ISO timestamps", () => {
    const unix =
      isoToUnixSeconds(
        "2026-09-04T08:02:50.667065013Z",
      );

    expect(unix).toBe(
      1788508970n,
    );
  });

  it("separates source age from cross-source skew", () => {
    const result =
      observeSourceTiming({
        evaluationTimeUnix:
          1788509000n,

        robinhoodPriceGeneratedAt:
          "2026-09-04T08:02:50.667065013Z",

        oracleUpdatedAtUnix:
          1788504295n,
      });

    expect(
      result.robinhoodPriceAgeSeconds,
    ).toBe(30);

    expect(
      result.oracleAgeSeconds,
    ).toBe(4705);

    expect(
      result.sourceSkewSeconds,
    ).toBe(4675);
  });

  it("rejects future source timestamps", () => {
    expect(() =>
      observeSourceTiming({
        evaluationTimeUnix:
          1000n,

        robinhoodPriceGeneratedAt:
          "1970-01-01T00:16:41Z",

        oracleUpdatedAtUnix:
          900n,
      }),
    ).toThrow(
      "Source timestamp cannot be later than evaluation time",
    );
  });
});
