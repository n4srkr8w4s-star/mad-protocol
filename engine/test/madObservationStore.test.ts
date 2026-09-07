import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  createFileMADObservationStore,
} from "../src/engine/madObservationStore.js";

import type {
  RobinhoodCompositeState,
} from "../src/engine/diffMADState.js";

import type {
  MADFlightRecord,
} from "../src/engine/madFlightRecorder.js";

const tempDirectories:
  string[] = [];

function tempStorePath() {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        "mad-observation-store-",
      ),
    );

  tempDirectories.push(
    directory,
  );

  return join(
    directory,
    "observations.json",
  );
}

function state(
  assetId: string,
  symbol: string,
  score = 0,
): RobinhoodCompositeState {
  return {
    asset: {
      symbol,
      name: symbol,
      assetId,
      isin:
        `${symbol}-ISIN`,
      status:
        "ASSET_STATUS_ACTIVE",
      contractAddress:
        "0x0000000000000000000000000000000000000001",
      chainId: 4663,
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
        marketHours:
          "REGULAR",
        marketAvailability:
          "OPEN",
        threshold: null,
      },

      timing: {
        evaluationTimeUnix:
          score === 0
            ? "1000"
            : "1060",
        robinhoodPriceAgeSeconds:
          0,
        oracleAgeSeconds:
          30,
        sourceSkewSeconds:
          0,
      },
    },

    disorders: {
      assessed: [],
      unassessed: [],
    },

    mad: {
      disorderScore:
        score,
      severity:
        (
          score === 0
            ? MADSeverity.NORMAL
            : MADSeverity.HIGH
        ),
      disorderBitmap:
        5n,
      activeDisorders: [],
      assessedDisorders: 0,
      unassessedDisorders: 0,
    },
  } as unknown as
    RobinhoodCompositeState;
}

function record(
  composite:
    RobinhoodCompositeState,
  recordedAt:
    string,
): MADFlightRecord {
  return {
    recordVersion: 1,

    recordedAt,

    asset: {
      symbol:
        composite.asset.symbol,
      assetId:
        composite.asset.assetId,
    },

    mad: {
      score:
        composite.mad.disorderScore,
      severity:
        composite.mad.severity,
      activeDisorders:
        composite.mad.activeDisorders,
    },

    transition: {
      status:
        "BASELINE_ESTABLISHED",
      asset: {
        symbol:
          composite.asset.symbol,
        assetId:
          composite.asset.assetId,
      },
      diff: null,
    },

    evidence: {
      asset: {
        symbol:
          composite.asset.symbol,
        assetId:
          composite.asset.assetId,
      },

      mad: {
        score:
          composite.mad.disorderScore,
        severity:
          composite.mad.severity,
        dominantDisorders: [],
      },

      disorders: [],
    },

    observations:
      composite.observations,
  };
}

afterEach(() => {
  for (
    const directory of
    tempDirectories.splice(0)
  ) {
    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

describe(
  "MAD Observation Store",
  () => {
    it(
      "persists Flight Recorder history across store recreation",
      () => {
        const filePath =
          tempStorePath();

        const firstStore =
          createFileMADObservationStore(
            filePath,
          );

        const composite =
          state(
            "aapl-id",
            "AAPL",
          );

        firstStore
          .commitObservation(
            composite,
            record(
              composite,
              "2026-09-07T01:00:00.000Z",
            ),
          );

        const secondStore =
          createFileMADObservationStore(
            filePath,
          );

        expect(
          secondStore
            .history(
              "aapl-id",
            ),
        ).toHaveLength(1);

        expect(
          secondStore
            .history(
              "aapl-id",
            )[0]
            .recordedAt,
        ).toBe(
          "2026-09-07T01:00:00.000Z",
        );
      },
    );

    it(
      "persists the last-good baseline across store recreation",
      () => {
        const filePath =
          tempStorePath();

        const firstStore =
          createFileMADObservationStore(
            filePath,
          );

        const composite =
          state(
            "aapl-id",
            "AAPL",
            25,
          );

        firstStore
          .commitObservation(
            composite,
            record(
              composite,
              "2026-09-07T01:00:00.000Z",
            ),
          );

        const secondStore =
          createFileMADObservationStore(
            filePath,
          );

        expect(
          secondStore
            .getBaseline(
              "aapl-id",
            )
            ?.mad
            .disorderScore,
        ).toBe(25);
      },
    );

    it(
      "round-trips bigint state safely",
      () => {
        const filePath =
          tempStorePath();

        const firstStore =
          createFileMADObservationStore(
            filePath,
          );

        const composite =
          state(
            "nvda-id",
            "NVDA",
          );

        firstStore
          .commitObservation(
            composite,
            record(
              composite,
              "2026-09-07T01:00:00.000Z",
            ),
          );

        const secondStore =
          createFileMADObservationStore(
            filePath,
          );

        expect(
          secondStore
            .getBaseline(
              "nvda-id",
            )
            ?.mad
            .disorderBitmap,
        ).toBe(5n);

        const raw =
          readFileSync(
            filePath,
            "utf8",
          );

        expect(
          raw,
        ).toContain(
          "__mad_bigint__",
        );
      },
    );

    it(
      "preserves chronological insertion order across restart",
      () => {
        const filePath =
          tempStorePath();

        const firstStore =
          createFileMADObservationStore(
            filePath,
          );

        const first =
          state(
            "nvda-id",
            "NVDA",
            0,
          );

        const second =
          state(
            "nvda-id",
            "NVDA",
            65,
          );

        firstStore
          .commitObservation(
            first,
            record(
              first,
              "2026-09-07T01:00:00.000Z",
            ),
          );

        firstStore
          .commitObservation(
            second,
            record(
              second,
              "2026-09-07T01:01:00.000Z",
            ),
          );

        const restarted =
          createFileMADObservationStore(
            filePath,
          );

        expect(
          restarted
            .history(
              "nvda-id",
            )
            .map(
              (entry) =>
                entry.recordedAt,
            ),
        ).toEqual([
          "2026-09-07T01:00:00.000Z",
          "2026-09-07T01:01:00.000Z",
        ]);
      },
    );

    it(
      "keeps histories and baselines isolated per asset",
      () => {
        const filePath =
          tempStorePath();

        const store =
          createFileMADObservationStore(
            filePath,
          );

        const aapl =
          state(
            "aapl-id",
            "AAPL",
          );

        const nvda =
          state(
            "nvda-id",
            "NVDA",
            65,
          );

        store.commitObservation(
          aapl,
          record(
            aapl,
            "2026-09-07T01:00:00.000Z",
          ),
        );

        store.commitObservation(
          nvda,
          record(
            nvda,
            "2026-09-07T01:01:00.000Z",
          ),
        );

        const restarted =
          createFileMADObservationStore(
            filePath,
          );

        expect(
          restarted
            .history(
              "aapl-id",
            ),
        ).toHaveLength(1);

        expect(
          restarted
            .history(
              "nvda-id",
            ),
        ).toHaveLength(1);

        expect(
          restarted
            .getBaseline(
              "aapl-id",
            )
            ?.asset.symbol,
        ).toBe("AAPL");

        expect(
          restarted
            .getBaseline(
              "nvda-id",
            )
            ?.asset.symbol,
        ).toBe("NVDA");
      },
    );

    it(
      "rejects corrupted persistence instead of inventing empty history",
      () => {
        const filePath =
          tempStorePath();

        writeFileSync(
          filePath,
          "{ definitely not valid json",
          "utf8",
        );

        expect(
          () =>
            createFileMADObservationStore(
              filePath,
            ),
        ).toThrow();
      },
    );

    it(
      "rejects mismatched baseline and Flight Record assets",
      () => {
        const filePath =
          tempStorePath();

        const store =
          createFileMADObservationStore(
            filePath,
          );

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

        expect(
          () =>
            store
              .commitObservation(
                aapl,
                record(
                  nvda,
                  "2026-09-07T01:00:00.000Z",
                ),
              ),
        ).toThrow(
          "MAD Observation Store cannot commit mismatched baseline and Flight Record assets.",
        );

        expect(
          store.size(),
        ).toBe(0);
      },
    );
  },
);
