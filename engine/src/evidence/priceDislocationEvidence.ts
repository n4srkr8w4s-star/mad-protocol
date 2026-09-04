import {
  ActiveDisorderId,
  type AssetContext,
  type DisorderEvaluation,
  type PriceObservation,
} from "../domain/types.js";

import { keccakUtf8 } from "../crypto/keccak.js";

export interface PriceDislocationEvidence {
  type: "CONTROLLED_TESTNET_DEMO";
  chainId: number;
  asset: string;
  symbol: string;
  expectedPriceE6: number;
  observedPriceE6: number;
  deviationBps: number;
  disorderId: ActiveDisorderId.PRICE_DISLOCATION;
  note: string;
}

function safeNumber(value: bigint, field: string): number {
  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue)) {
    throw new Error(`${field} exceeds safe integer range`);
  }

  return numberValue;
}

export function buildPriceDislocationEvidence(
  asset: AssetContext,
  observation: PriceObservation,
  evaluation: DisorderEvaluation,
): {
  payload: PriceDislocationEvidence;
  json: string;
  hash: `0x${string}`;
} {
  if (
    evaluation.disorderId !==
    ActiveDisorderId.PRICE_DISLOCATION
  ) {
    throw new Error(
      "Evaluation is not a PRICE_DISLOCATION result",
    );
  }

  const payload: PriceDislocationEvidence = {
    type: "CONTROLLED_TESTNET_DEMO",
    chainId: asset.chainId,
    asset: asset.assetAddress,
    symbol: asset.symbol,
    expectedPriceE6: safeNumber(
      observation.expectedPriceE6,
      "expectedPriceE6",
    ),
    observedPriceE6: safeNumber(
      observation.observedPriceE6,
      "observedPriceE6",
    ),
    deviationBps: evaluation.deviationBps,
    disorderId: ActiveDisorderId.PRICE_DISLOCATION,
    note: "Synthetic test evidence; not live market data",
  };

  const json = JSON.stringify(payload);

  return {
    payload,
    json,
    hash: keccakUtf8(json),
  };
}
