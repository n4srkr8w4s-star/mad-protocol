import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";

import {
  dirname,
} from "node:path";

import type {
  RobinhoodCompositeState,
} from "./diffMADState.js";

import type {
  MADFlightRecord,
} from "./madFlightRecorder.js";

interface MADObservationStoreDocument {
  storeVersion: 1;
  baselines: Record<
    string,
    RobinhoodCompositeState
  >;
  flightRecords: Record<
    string,
    MADFlightRecord[]
  >;
}

export interface MADObservationStore {
  getBaseline(
    assetId: string,
  ): RobinhoodCompositeState | undefined;

  history(
    assetId: string,
  ): readonly MADFlightRecord[];

  commitObservation(
    baseline: RobinhoodCompositeState,
    record: MADFlightRecord,
  ): void;

  clear(
    assetId?: string,
  ): void;

  size(): number;
}

function emptyDocument():
  MADObservationStoreDocument {
  return {
    storeVersion: 1,
    baselines: {},
    flightRecords: {},
  };
}

const BIGINT_TAG =
  "__mad_bigint__";

function serialize(
  document: MADObservationStoreDocument,
): string {
  return JSON.stringify(
    document,
    (_key, value) => {
      if (
        typeof value ===
        "bigint"
      ) {
        return {
          [BIGINT_TAG]:
            value.toString(),
        };
      }

      return value;
    },
    2,
  );
}

function deserialize(
  raw: string,
): MADObservationStoreDocument {
  const parsed =
    JSON.parse(
      raw,
      (_key, value) => {
        if (
          value &&
          typeof value ===
            "object" &&
          Object.keys(value)
            .length === 1 &&
          typeof value[
            BIGINT_TAG
          ] === "string"
        ) {
          return BigInt(
            value[BIGINT_TAG],
          );
        }

        return value;
      },
    ) as unknown;

  if (
    !parsed ||
    typeof parsed !==
      "object" ||
    !(
      "storeVersion" in
      parsed
    ) ||
    parsed.storeVersion !==
      1 ||
    !(
      "baselines" in
      parsed
    ) ||
    !(
      "flightRecords" in
      parsed
    ) ||
    typeof parsed.baselines !==
      "object" ||
    parsed.baselines ===
      null ||
    typeof parsed.flightRecords !==
      "object" ||
    parsed.flightRecords ===
      null
  ) {
    throw new Error(
      "Invalid MAD Observation Store document.",
    );
  }

  return parsed as
    MADObservationStoreDocument;
}

export function createFileMADObservationStore(
  filePath: string,
): MADObservationStore {
  let document =
    emptyDocument();

  try {
    const raw =
      readFileSync(
        filePath,
        "utf8",
      );

    document =
      deserialize(raw);
  } catch (error) {
    const code =
      (
        error as
          NodeJS.ErrnoException
      ).code;

    if (code !== "ENOENT") {
      throw error;
    }
  }

  function persist() {
    mkdirSync(
      dirname(filePath),
      {
        recursive: true,
      },
    );

    const temporaryPath =
      `${filePath}.tmp`;

    writeFileSync(
      temporaryPath,
      serialize(document),
      "utf8",
    );

    /*
     * Rename only after the complete
     * document has been written.
     *
     * Readers therefore see either the
     * previous complete store or the
     * new complete store.
     */
    renameSync(
      temporaryPath,
      filePath,
    );
  }

  function getBaseline(
    assetId: string,
  ) {
    return document
      .baselines[
        assetId
      ];
  }

  function history(
    assetId: string,
  ): readonly MADFlightRecord[] {
    return [
      ...(
        document
          .flightRecords[
            assetId
          ] ?? []
      ),
    ];
  }

  function commitObservation(
    baseline:
      RobinhoodCompositeState,
    record:
      MADFlightRecord,
  ) {
    const assetId =
      baseline.asset.assetId;

    if (
      record.asset.assetId !==
      assetId
    ) {
      throw new Error(
        "MAD Observation Store cannot commit mismatched baseline and Flight Record assets.",
      );
    }

    const previousBaseline =
      document.baselines[
        assetId
      ];

    const previousHistory =
      document.flightRecords[
        assetId
      ];

    document.baselines[
      assetId
    ] =
      baseline;

    document.flightRecords[
      assetId
    ] = [
      ...(previousHistory ?? []),
      record,
    ];

    try {
      persist();
    } catch (error) {
      if (
        previousBaseline ===
        undefined
      ) {
        delete document
          .baselines[
            assetId
          ];
      } else {
        document.baselines[
          assetId
        ] =
          previousBaseline;
      }

      if (
        previousHistory ===
        undefined
      ) {
        delete document
          .flightRecords[
            assetId
          ];
      } else {
        document.flightRecords[
          assetId
        ] =
          previousHistory;
      }

      throw error;
    }
  }

  function clear(
    assetId?: string,
  ) {
    const previous =
      document;

    if (
      assetId === undefined
    ) {
      document =
        emptyDocument();
    } else {
      document = {
        storeVersion: 1,
        baselines: {
          ...document.baselines,
        },
        flightRecords: {
          ...document.flightRecords,
        },
      };

      delete document
        .baselines[
          assetId
        ];

      delete document
        .flightRecords[
          assetId
        ];
    }

    try {
      persist();
    } catch (error) {
      document =
        previous;
      throw error;
    }
  }

  function size() {
    return Object.values(
      document.flightRecords,
    ).reduce(
      (
        total,
        records,
      ) =>
        total +
        records.length,
      0,
    );
  }

  return {
    getBaseline,
    history,
    commitObservation,
    clear,
    size,
  };
}
