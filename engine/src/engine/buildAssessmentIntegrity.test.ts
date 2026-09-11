import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ActiveDisorderId,
} from "../domain/types.js";

import {
  buildAssessmentCoverage,
  buildAssessmentCoherence,
  buildAssessmentIntegrity,
  buildAssessmentFreshness,
  buildAssessmentSourceHealth,
  buildAssessmentSufficiency,
} from "./buildAssessmentIntegrity.js";

import type {
  RobinhoodCompositeState,
} from "./diffMADState.js";

import type {
  MADAssessmentCoverage,
} from "./buildAssessmentIntegrity.js";

import type {
  RobinhoodAssetCapability,
} from "./resolveRobinhoodCapability.js";

function capability(
  supported: ActiveDisorderId[],
): RobinhoodAssetCapability {
  const all = [
    ActiveDisorderId.UNDERLYING_TRADING_HALT,
    ActiveDisorderId.MULTIPLIER_TRANSITION,
    ActiveDisorderId.REFERENCE_DATA_STALE,
    ActiveDisorderId.ORACLE_DEVIATION,
  ];

  return {
    disorders: all.map((id) => ({
      id,
      code: `AD-${Number(id)}`,
      supported: supported.includes(id),
      reason: "test",
    })),
  } as RobinhoodAssetCapability;
}

function composite(
  assessed: ActiveDisorderId[],
  unassessed: Array<{
    id: ActiveDisorderId;
    disposition:
      | "NOT_APPLICABLE"
      | "EVIDENCE_UNAVAILABLE";
    reason: string;
  }> = [],
): RobinhoodCompositeState {
  return {
    disorders: {
      assessed: assessed.map((id) => ({
        id,
        code: `AD-${Number(id)}`,
        evaluation: {},
      })),
      unassessed: unassessed.map(
        (item) => ({
          id: item.id,
          code: `AD-${Number(item.id)}`,
          disposition:
            item.disposition,
          reason: item.reason,
        }),
      ),
    },
  } as unknown as RobinhoodCompositeState;
}

describe("buildAssessmentCoverage", () => {
  const fullSupport = [
    ActiveDisorderId.UNDERLYING_TRADING_HALT,
    ActiveDisorderId.MULTIPLIER_TRANSITION,
    ActiveDisorderId.REFERENCE_DATA_STALE,
    ActiveDisorderId.ORACLE_DEVIATION,
  ];

  it("reports COMPLETE when every applicable supported disorder is assessed", () => {
    const result =
      buildAssessmentCoverage(
        composite(fullSupport),
        capability(fullSupport),
      );

    expect(result).toEqual({
      status: "COMPLETE",
      applicable: 4,
      assessed: 4,
      notApplicable: 0,
      unavailable: 0,
      unsupported: 0,
      gaps: [],
    });
  });

  it("does not penalise coverage for NOT_APPLICABLE", () => {
    const result =
      buildAssessmentCoverage(
        composite(
          [
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
            ActiveDisorderId.MULTIPLIER_TRANSITION,
            ActiveDisorderId.REFERENCE_DATA_STALE,
          ],
          [
            {
              id:
                ActiveDisorderId.ORACLE_DEVIATION,
              disposition:
                "NOT_APPLICABLE",
              reason:
                "Reference market is closed.",
            },
          ],
        ),
        capability(fullSupport),
      );

    expect(result.status).toBe(
      "COMPLETE",
    );
    expect(result.applicable).toBe(3);
    expect(result.assessed).toBe(3);
    expect(result.notApplicable).toBe(1);
    expect(result.unavailable).toBe(0);
  });

  it("reports PARTIAL when applicable evidence is unavailable", () => {
    const result =
      buildAssessmentCoverage(
        composite(
          [
            ActiveDisorderId.UNDERLYING_TRADING_HALT,
            ActiveDisorderId.MULTIPLIER_TRANSITION,
            ActiveDisorderId.REFERENCE_DATA_STALE,
          ],
          [
            {
              id:
                ActiveDisorderId.ORACLE_DEVIATION,
              disposition:
                "EVIDENCE_UNAVAILABLE",
              reason:
                "Reference market availability is unknown.",
            },
          ],
        ),
        capability(fullSupport),
      );

    expect(result.status).toBe(
      "PARTIAL",
    );
    expect(result.applicable).toBe(4);
    expect(result.assessed).toBe(3);
    expect(result.unavailable).toBe(1);
    expect(result.gaps).toHaveLength(1);
  });

  it("does not treat unsupported capability as missing coverage", () => {
    const supported = [
      ActiveDisorderId.UNDERLYING_TRADING_HALT,
      ActiveDisorderId.MULTIPLIER_TRANSITION,
    ];

    const result =
      buildAssessmentCoverage(
        composite(supported),
        capability(supported),
      );

    expect(result.status).toBe(
      "COMPLETE",
    );
    expect(result.applicable).toBe(2);
    expect(result.assessed).toBe(2);
    expect(result.unsupported).toBe(2);
    expect(result.unavailable).toBe(0);
  });

  it("reports INSUFFICIENT when no applicable supported disorder can be assessed", () => {
    const supported = [
      ActiveDisorderId.ORACLE_DEVIATION,
    ];

    const result =
      buildAssessmentCoverage(
        composite(
          [],
          [
            {
              id:
                ActiveDisorderId.ORACLE_DEVIATION,
              disposition:
                "EVIDENCE_UNAVAILABLE",
              reason:
                "Required evidence unavailable.",
            },
          ],
        ),
        capability(supported),
      );

    expect(result.status).toBe(
      "INSUFFICIENT",
    );
    expect(result.applicable).toBe(1);
    expect(result.assessed).toBe(0);
    expect(result.unavailable).toBe(1);
  });

  it("fails closed when a supported disorder has no assessment outcome", () => {
    const supported = [
      ActiveDisorderId.UNDERLYING_TRADING_HALT,
    ];

    const result =
      buildAssessmentCoverage(
        composite([]),
        capability(supported),
      );

    expect(result.status).toBe(
      "INSUFFICIENT",
    );
    expect(result.unavailable).toBe(1);
    expect(result.gaps[0]?.reason).toBe(
      "Supported disorder has no trustworthy assessment outcome.",
    );
  });
});


describe("buildAssessmentFreshness", () => {
  function freshnessComposite(input: {
    oracleAgeSeconds: number;
    heartbeatSeconds: number;
    marketAvailability:
      | "OPEN"
      | "CLOSED"
      | "UNKNOWN";
    robinhoodPriceAgeSeconds?: number;
    sourceSkewSeconds?: number;
  }): RobinhoodCompositeState {
    return {
      observations: {
        timing: {
          oracleAgeSeconds:
            input.oracleAgeSeconds,
          robinhoodPriceAgeSeconds:
            input.robinhoodPriceAgeSeconds ?? 2,
          sourceSkewSeconds:
            input.sourceSkewSeconds ?? 1,
        },
        oracle: {
          heartbeatSeconds:
            input.heartbeatSeconds,
          marketAvailability:
            input.marketAvailability,
        },
      },
    } as unknown as RobinhoodCompositeState;
  }

  it("reports FRESH when oracle evidence is within the published heartbeat while the market is open", () => {
    const result =
      buildAssessmentFreshness(
        freshnessComposite({
          oracleAgeSeconds: 30,
          heartbeatSeconds: 60,
          marketAvailability: "OPEN",
        }),
      );

    expect(result.status).toBe("FRESH");
    expect(result.oracleAgeSeconds).toBe(30);
    expect(
      result.oracleHeartbeatSeconds,
    ).toBe(60);
  });

  it("reports STALE when oracle evidence exceeds the published heartbeat while the market is open", () => {
    const result =
      buildAssessmentFreshness(
        freshnessComposite({
          oracleAgeSeconds: 61,
          heartbeatSeconds: 60,
          marketAvailability: "OPEN",
        }),
      );

    expect(result.status).toBe("STALE");
  });

  it("does not classify old oracle evidence as stale solely because the market is closed", () => {
    const result =
      buildAssessmentFreshness(
        freshnessComposite({
          oracleAgeSeconds: 3600,
          heartbeatSeconds: 60,
          marketAvailability: "CLOSED",
        }),
      );

    expect(result.status).toBe("FRESH");
    expect(result.reason).toContain(
      "market is closed",
    );
  });

  it("reports UNKNOWN when market-hours semantics are unknown", () => {
    const result =
      buildAssessmentFreshness(
        freshnessComposite({
          oracleAgeSeconds: 30,
          heartbeatSeconds: 60,
          marketAvailability: "UNKNOWN",
        }),
      );

    expect(result.status).toBe("UNKNOWN");
  });

  it("does not invent a freshness judgement from Robinhood price age", () => {
    const result =
      buildAssessmentFreshness(
        freshnessComposite({
          oracleAgeSeconds: 30,
          heartbeatSeconds: 60,
          marketAvailability: "OPEN",
          robinhoodPriceAgeSeconds: 9999,
        }),
      );

    expect(result.status).toBe("FRESH");
    expect(
      result.robinhoodPriceAgeSeconds,
    ).toBe(9999);
  });
});


describe("buildAssessmentSourceHealth", () => {
  function health(
    status:
      | "UNKNOWN"
      | "HEALTHY"
      | "DEGRADED"
      | "UNAVAILABLE",
  ) {
    return {
      source: "ROBINHOOD_PRICES" as const,
      status,
      assetsRequested:
        status === "UNKNOWN" ? 0 : 1,
      successfulAssets:
        status === "HEALTHY" ||
        status === "DEGRADED"
          ? 1
          : 0,
      failedAssets:
        status === "UNAVAILABLE" ? 1 : 0,
      requestAttempts:
        status === "UNKNOWN" ? 0 : 1,
      rateLimitEvents:
        status === "DEGRADED" ? 1 : 0,
      recoveredAssets:
        status === "DEGRADED" ? 1 : 0,
      affectedAssets:
        status === "DEGRADED" ||
        status === "UNAVAILABLE"
          ? ["NVDA"]
          : [],
    };
  }

  it("reports UNKNOWN when no source-health observation is supplied", () => {
    const result =
      buildAssessmentSourceHealth(
        undefined,
      );

    expect(result.status).toBe(
      "UNKNOWN",
    );
    expect(result.sources).toEqual([]);
  });

  it("preserves HEALTHY from the existing Robinhood source-health model", () => {
    const result =
      buildAssessmentSourceHealth(
        health("HEALTHY"),
      );

    expect(result.status).toBe(
      "HEALTHY",
    );
    expect(result.sources[0]).toMatchObject({
      source: "ROBINHOOD_PRICES",
      status: "HEALTHY",
    });
  });

  it("preserves DEGRADED and its operational evidence", () => {
    const result =
      buildAssessmentSourceHealth(
        health("DEGRADED"),
      );

    expect(result.status).toBe(
      "DEGRADED",
    );
    expect(
      result.sources[0]?.rateLimitEvents,
    ).toBe(1);
    expect(
      result.sources[0]?.recoveredAssets,
    ).toBe(1);
    expect(
      result.sources[0]?.affectedAssets,
    ).toEqual(["NVDA"]);
  });

  it("preserves UNAVAILABLE without inventing health for other sources", () => {
    const result =
      buildAssessmentSourceHealth(
        health("UNAVAILABLE"),
      );

    expect(result.status).toBe(
      "UNAVAILABLE",
    );
    expect(result.sources).toHaveLength(
      1,
    );
    expect(
      result.sources[0]?.source,
    ).toBe("ROBINHOOD_PRICES");
  });

  it("preserves UNKNOWN from an observed source-health cycle", () => {
    const result =
      buildAssessmentSourceHealth(
        health("UNKNOWN"),
      );

    expect(result.status).toBe(
      "UNKNOWN",
    );
    expect(result.sources).toHaveLength(
      1,
    );
  });
});


describe("buildAssessmentSufficiency", () => {
  function sufficiencyComposite(input: {
    score: number;
    activeDisorders?: number[];
  }): RobinhoodCompositeState {
    return {
      mad: {
        disorderScore: input.score,
        activeDisorders:
          (input.activeDisorders ?? []).map(
            (id) => ({
              disorderId: id,
              score: input.score,
              severity: 0,
            }),
          ),
      },
    } as unknown as RobinhoodCompositeState;
  }

  function coverageStatus(
    status:
      | "COMPLETE"
      | "PARTIAL"
      | "INSUFFICIENT",
  ) {
    return {
      status,
      applicable: 0,
      assessed: 0,
      notApplicable: 0,
      unavailable: 0,
      unsupported: 0,
      gaps: [],
    };
  }

  it("reports SUFFICIENT for a directly observed disordered state even when coverage is partial", () => {
    const result =
      buildAssessmentSufficiency(
        sufficiencyComposite({
          score: 65,
          activeDisorders: [
            ActiveDisorderId.ORACLE_DEVIATION,
          ],
        }),
        coverageStatus("PARTIAL"),
      );

    expect(result.status).toBe(
      "SUFFICIENT",
    );
    expect(result.claim).toBe(
      "DISORDERED",
    );
  });

  it("reports SUFFICIENT for a normal state only when applicable coverage is complete", () => {
    const result =
      buildAssessmentSufficiency(
        sufficiencyComposite({
          score: 0,
        }),
        coverageStatus("COMPLETE"),
      );

    expect(result.status).toBe(
      "SUFFICIENT",
    );
    expect(result.claim).toBe(
      "NORMAL",
    );
  });

  it("reports LIMITED when MAD appears normal but applicable coverage is partial", () => {
    const result =
      buildAssessmentSufficiency(
        sufficiencyComposite({
          score: 0,
        }),
        coverageStatus("PARTIAL"),
      );

    expect(result.status).toBe(
      "LIMITED",
    );
    expect(result.claim).toBe(
      "NORMAL",
    );
  });

  it("reports INSUFFICIENT when MAD appears normal and applicable coverage is insufficient", () => {
    const result =
      buildAssessmentSufficiency(
        sufficiencyComposite({
          score: 0,
        }),
        coverageStatus(
          "INSUFFICIENT",
        ),
      );

    expect(result.status).toBe(
      "INSUFFICIENT",
    );
  });

  it("fails closed when MAD has a non-zero score without active disorder evidence", () => {
    const result =
      buildAssessmentSufficiency(
        sufficiencyComposite({
          score: 65,
          activeDisorders: [],
        }),
        coverageStatus("COMPLETE"),
      );

    expect(result.status).toBe(
      "INSUFFICIENT",
    );
    expect(result.claim).toBe(
      "DISORDERED",
    );
  });
});


describe("buildAssessmentCoherence", () => {
  function coherenceComposite(
    assessedCount: number,
  ): RobinhoodCompositeState {
    return {
      disorders: {
        assessed:
          Array.from(
            { length: assessedCount },
            (_, index) => ({
              id: index + 1,
              code: `AD-${index + 1}`,
              evaluation: {},
            }),
          ),
        unassessed: [],
      },
    } as unknown as RobinhoodCompositeState;
  }

  function coherenceCoverage(
    status:
      | "COMPLETE"
      | "PARTIAL"
      | "INSUFFICIENT",
  ): MADAssessmentCoverage {
    return {
      status,
      applicable: 0,
      assessed: 0,
      notApplicable: 0,
      unavailable: 0,
      unsupported: 0,
      gaps: [],
    };
  }

  it("reports UNKNOWN when coverage is insufficient", () => {
    const result =
      buildAssessmentCoherence(
        coherenceComposite(2),
        coherenceCoverage(
          "INSUFFICIENT",
        ),
      );

    expect(result.status).toBe(
      "UNKNOWN",
    );
  });

  it("reports NOT_APPLICABLE when fewer than two disorder assessments exist", () => {
    const result =
      buildAssessmentCoherence(
        coherenceComposite(1),
        coherenceCoverage(
          "COMPLETE",
        ),
      );

    expect(result.status).toBe(
      "NOT_APPLICABLE",
    );
  });

  it("does not invent coherence when no deterministic cross-signal rule exists", () => {
    const result =
      buildAssessmentCoherence(
        coherenceComposite(4),
        coherenceCoverage(
          "COMPLETE",
        ),
      );

    expect(result.status).toBe(
      "NOT_APPLICABLE",
    );

    expect(result.reason).toContain(
      "No deterministic cross-signal coherence rule",
    );
  });

  it("does not manufacture MIXED from partial coverage alone", () => {
    const result =
      buildAssessmentCoherence(
        coherenceComposite(3),
        coherenceCoverage(
          "PARTIAL",
        ),
      );

    expect(result.status).toBe(
      "NOT_APPLICABLE",
    );
  });
});


describe("buildAssessmentIntegrity", () => {
  function integrityComposite(input: {
    score?: number;
    marketAvailability?:
      | "OPEN"
      | "CLOSED"
      | "UNKNOWN";
    oracleAgeSeconds?: number;
    heartbeatSeconds?: number;
    unassessedDisposition?:
      | "NOT_APPLICABLE"
      | "EVIDENCE_UNAVAILABLE";
  }): RobinhoodCompositeState {
    const score =
      input.score ?? 0;

    const marketAvailability =
      input.marketAvailability ??
      "OPEN";

    const all = [
      ActiveDisorderId.UNDERLYING_TRADING_HALT,
      ActiveDisorderId.MULTIPLIER_TRANSITION,
      ActiveDisorderId.REFERENCE_DATA_STALE,
      ActiveDisorderId.ORACLE_DEVIATION,
    ];

    const unassessed =
      input.unassessedDisposition
        ? [
            {
              id:
                ActiveDisorderId.ORACLE_DEVIATION,
              code:
                "ORACLE_DEVIATION",
              disposition:
                input.unassessedDisposition,
              reason:
                "test",
            },
          ]
        : [];

    const assessed =
      input.unassessedDisposition
        ? all
            .filter(
              (id) =>
                id !==
                ActiveDisorderId.ORACLE_DEVIATION,
            )
            .map((id) => ({
              id,
              code: `AD-${Number(id)}`,
              evaluation: {},
            }))
        : all.map((id) => ({
            id,
            code: `AD-${Number(id)}`,
            evaluation: {},
          }));

    return {
      observations: {
        timing: {
          oracleAgeSeconds:
            input.oracleAgeSeconds ?? 30,
          robinhoodPriceAgeSeconds: 2,
          sourceSkewSeconds: 1,
        },
        oracle: {
          heartbeatSeconds:
            input.heartbeatSeconds ?? 60,
          marketAvailability,
        },
      },
      disorders: {
        assessed,
        unassessed,
      },
      mad: {
        disorderScore: score,
        activeDisorders:
          score > 0
            ? [
                {
                  disorderId:
                    ActiveDisorderId.REFERENCE_DATA_STALE,
                  score,
                  severity: 0,
                },
              ]
            : [],
      },
    } as unknown as RobinhoodCompositeState;
  }

  function fullCapability():
    RobinhoodAssetCapability {
    const all = [
      ActiveDisorderId.UNDERLYING_TRADING_HALT,
      ActiveDisorderId.MULTIPLIER_TRANSITION,
      ActiveDisorderId.REFERENCE_DATA_STALE,
      ActiveDisorderId.ORACLE_DEVIATION,
    ];

    return {
      disorders: all.map((id) => ({
        id,
        code: `AD-${Number(id)}`,
        supported: true,
        reason: "test",
      })),
    } as RobinhoodAssetCapability;
  }

  function sourceHealth(
    status:
      | "UNKNOWN"
      | "HEALTHY"
      | "DEGRADED"
      | "UNAVAILABLE",
  ) {
    return {
      source: "ROBINHOOD_PRICES" as const,
      status,
      assetsRequested:
        status === "UNKNOWN" ? 0 : 1,
      successfulAssets:
        status === "HEALTHY" ||
        status === "DEGRADED"
          ? 1
          : 0,
      failedAssets:
        status === "UNAVAILABLE" ? 1 : 0,
      requestAttempts:
        status === "UNKNOWN" ? 0 : 1,
      rateLimitEvents:
        status === "DEGRADED" ? 1 : 0,
      recoveredAssets:
        status === "DEGRADED" ? 1 : 0,
      affectedAssets:
        status === "HEALTHY" ||
        status === "UNKNOWN"
          ? []
          : ["NVDA"],
    };
  }

  it("reports STRONG only when all required integrity dimensions are strong", () => {
    const result =
      buildAssessmentIntegrity(
        integrityComposite({}),
        fullCapability(),
        sourceHealth("HEALTHY"),
      );

    expect(result.level).toBe(
      "STRONG",
    );
    expect(result.reasons).toEqual([]);
  });

  it("reports ADEQUATE when source health was not observed but the assessment is otherwise strong", () => {
    const result =
      buildAssessmentIntegrity(
        integrityComposite({}),
        fullCapability(),
        undefined,
      );

    expect(result.level).toBe(
      "ADEQUATE",
    );
    expect(
      result.sourceHealth.status,
    ).toBe("UNKNOWN");
  });

  it("reports LIMITED when coverage is partial even when an active disorder is directly supported", () => {
    const result =
      buildAssessmentIntegrity(
        integrityComposite({
          score: 65,
          unassessedDisposition:
            "EVIDENCE_UNAVAILABLE",
        }),
        fullCapability(),
        sourceHealth("HEALTHY"),
      );

    expect(result.level).toBe(
      "LIMITED",
    );
    expect(
      result.sufficiency.status,
    ).toBe("SUFFICIENT");
    expect(
      result.coverage.status,
    ).toBe("PARTIAL");
  });

  it("reports LIMITED when assessment evidence is stale", () => {
    const result =
      buildAssessmentIntegrity(
        integrityComposite({
          score: 65,
          oracleAgeSeconds: 61,
          heartbeatSeconds: 60,
        }),
        fullCapability(),
        sourceHealth("HEALTHY"),
      );

    expect(result.level).toBe(
      "LIMITED",
    );
    expect(
      result.freshness.status,
    ).toBe("STALE");
  });

  it("reports LIMITED when observed source health is degraded", () => {
    const result =
      buildAssessmentIntegrity(
        integrityComposite({}),
        fullCapability(),
        sourceHealth("DEGRADED"),
      );

    expect(result.level).toBe(
      "LIMITED",
    );
  });

  it("reports INSUFFICIENT when a normal-state claim lacks sufficient applicable coverage", () => {
    const result =
      buildAssessmentIntegrity(
        integrityComposite({
          score: 0,
          unassessedDisposition:
            "EVIDENCE_UNAVAILABLE",
        }),
        {
          ...fullCapability(),
          disorders:
            fullCapability()
              .disorders
              .filter(
                (disorder) =>
                  disorder.id ===
                  ActiveDisorderId.ORACLE_DEVIATION,
              ),
        } as RobinhoodAssetCapability,
        sourceHealth("HEALTHY"),
      );

    expect(result.level).toBe(
      "INSUFFICIENT",
    );
  });

  it("reports INSUFFICIENT when an observed required source is unavailable", () => {
    const result =
      buildAssessmentIntegrity(
        integrityComposite({}),
        fullCapability(),
        sourceHealth(
          "UNAVAILABLE",
        ),
      );

    expect(result.level).toBe(
      "INSUFFICIENT",
    );
  });

  it("does not penalise closed-market NOT_APPLICABLE coverage", () => {
    const result =
      buildAssessmentIntegrity(
        integrityComposite({
          marketAvailability:
            "CLOSED",
          oracleAgeSeconds: 3600,
          heartbeatSeconds: 60,
          unassessedDisposition:
            "NOT_APPLICABLE",
        }),
        fullCapability(),
        sourceHealth("HEALTHY"),
      );

    expect(
      result.coverage.status,
    ).toBe("COMPLETE");
    expect(
      result.freshness.status,
    ).toBe("FRESH");
    expect(result.level).toBe(
      "STRONG",
    );
  });
});
