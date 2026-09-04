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
  aggregateDisorders,
} from "../src/engine/aggregateDisorders.js";

describe("MAD disorder aggregation", () => {
  it("produces NORMAL state when all assessed disorders are inactive", () => {
    const result =
      aggregateDisorders([
        {
          disorderId:
            ActiveDisorderId.MULTIPLIER_TRANSITION,
          active: false,
          score: 0,
          severity:
            MADSeverity.NORMAL,
        },
        {
          disorderId:
            ActiveDisorderId.ORACLE_DEVIATION,
          active: false,
          score: 0,
          severity:
            MADSeverity.NORMAL,
        },
      ]);

    expect(
      result.disorderScore,
    ).toBe(0);

    expect(
      result.severity,
    ).toBe(
      MADSeverity.NORMAL,
    );

    expect(
      result.disorderBitmap,
    ).toBe(0n);

    expect(
      result.activeDisorders,
    ).toEqual([]);
  });

  it("uses the highest active disorder score for composite severity", () => {
    const result =
      aggregateDisorders([
        {
          disorderId:
            ActiveDisorderId.MULTIPLIER_TRANSITION,
          active: true,
          score: 40,
          severity:
            MADSeverity.ELEVATED,
        },
        {
          disorderId:
            ActiveDisorderId.ORACLE_DEVIATION,
          active: true,
          score: 65,
          severity:
            MADSeverity.HIGH,
        },
      ]);

    expect(
      result.disorderScore,
    ).toBe(65);

    expect(
      result.severity,
    ).toBe(
      MADSeverity.HIGH,
    );

    expect(
      result.disorderBitmap,
    ).toBe(
      (1n << 3n) |
      (1n << 7n),
    );

    expect(
      result.activeDisorders.map(
        (item) =>
          item.disorderId,
      ),
    ).toEqual([
      ActiveDisorderId.MULTIPLIER_TRANSITION,
      ActiveDisorderId.ORACLE_DEVIATION,
    ]);
  });

  it("rejects duplicate disorder evaluations", () => {
    expect(() =>
      aggregateDisorders([
        {
          disorderId:
            ActiveDisorderId.ORACLE_DEVIATION,
          active: false,
          score: 0,
          severity:
            MADSeverity.NORMAL,
        },
        {
          disorderId:
            ActiveDisorderId.ORACLE_DEVIATION,
          active: false,
          score: 0,
          severity:
            MADSeverity.NORMAL,
        },
      ]),
    ).toThrow(
      "Duplicate disorder evaluation",
    );
  });

  it("rejects inconsistent activity and score", () => {
    expect(() =>
      aggregateDisorders([
        {
          disorderId:
            ActiveDisorderId.ORACLE_DEVIATION,
          active: false,
          score: 65,
          severity:
            MADSeverity.HIGH,
        },
      ]),
    ).toThrow(
      "Inconsistent disorder activity",
    );
  });

  it("rejects inconsistent severity", () => {
    expect(() =>
      aggregateDisorders([
        {
          disorderId:
            ActiveDisorderId.ORACLE_DEVIATION,
          active: true,
          score: 65,
          severity:
            MADSeverity.NORMAL,
        },
      ]),
    ).toThrow(
      "Inconsistent disorder severity",
    );
  });
});
