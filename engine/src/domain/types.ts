export enum MADSeverity {
  NORMAL = 0,
  WATCH = 1,
  ELEVATED = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export enum ActiveDisorderId {
  PRICE_DISLOCATION = 0,
  UNDERLYING_TRADING_HALT = 1,
  CORPORATE_ACTION_PENDING = 2,
  MULTIPLIER_TRANSITION = 3,
  REFERENCE_DATA_STALE = 4,
  LIQUIDITY_STRESS = 5,
  MARKET_SESSION_DISLOCATION = 6,
  ORACLE_DEVIATION = 7,
}

export type MarketSessionState =
  | "OPEN"
  | "CLOSED"
  | "PRE_MARKET"
  | "AFTER_HOURS"
  | "OVERNIGHT"
  | "UNKNOWN";

export type DataSourceKind =
  | "ROBINHOOD"
  | "CHAINLINK"
  | "ONCHAIN"
  | "MARKET_REFERENCE"
  | "CONTROLLED_TEST";

export interface DataSourceReference {
  id: string;
  kind: DataSourceKind;
  observedAt?: string;
}

export interface AssetContext {
  chainId: number;
  assetAddress: string;
  symbol: string;

  underlyingSymbol?: string;
  marketSession?: MarketSessionState;
  sources?: DataSourceReference[];
}

export interface PriceObservation {
  expectedPriceE6: bigint;
  observedPriceE6: bigint;
}

export interface PriceDislocationRuleset {
  id: string;
  disorderId: ActiveDisorderId.PRICE_DISLOCATION;
  thresholdBps: number;

  scoreBands: Array<{
    minBps: number;
    score: number;
  }>;

  absoluteDeviation: boolean;
}

export interface DisorderEvaluation {
  disorderId: ActiveDisorderId;
  active: boolean;

  score: number;
  severity: MADSeverity;

  deviationBps: number;
  direction: "ABOVE" | "BELOW" | "FLAT";

  reason: string;
}
