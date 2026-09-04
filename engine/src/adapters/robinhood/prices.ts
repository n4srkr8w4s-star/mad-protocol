import { parseUnits } from "viem";

const ROBINHOOD_PRICES_BASE_URL =
  "https://api.robinhood.com/rhj/prices";

export interface RobinhoodPriceDeployment {
  contractAddress: string;
  chainId: number;
  networkName: string;
}

export interface RobinhoodPriceQuote {
  tokenSymbol: string;
  deployments: RobinhoodPriceDeployment[];
  bid: string;
  ask: string;
  currency: string;
  dailyTradingVolume: string;
  isTradingHalt: boolean;
  generatedAt: string;
  dailyHigh: string;
  dailyLow: string;
  mintBurnTokenVolume: string;
  mintBurnUsdVolume: string;
}

interface RobinhoodPricesResponse {
  quotes: RobinhoodPriceQuote[];
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function parseRobinhoodPricesResponse(
  value: unknown,
): RobinhoodPricesResponse {
  if (!isRecord(value)) {
    throw new Error(
      "Invalid Robinhood prices response",
    );
  }

  if (!Array.isArray(value.quotes)) {
    throw new Error(
      "Robinhood prices response does not contain a quotes array",
    );
  }

  return {
    quotes:
      value.quotes as RobinhoodPriceQuote[],
  };
}

export async function fetchRobinhoodPrice(
  symbol: string,
  fetchFn: typeof fetch = fetch,
): Promise<RobinhoodPriceQuote> {
  const response = await fetchFn(
    `${ROBINHOOD_PRICES_BASE_URL}/${encodeURIComponent(
      symbol.toUpperCase(),
    )}`,
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Robinhood price request failed: HTTP ${response.status}`,
    );
  }

  const payload: unknown =
    await response.json();

  const { quotes } =
    parseRobinhoodPricesResponse(payload);

  const quote = quotes.find(
    (candidate) =>
      candidate.tokenSymbol.toUpperCase() ===
      symbol.toUpperCase(),
  );

  if (!quote) {
    throw new Error(
      `Robinhood price quote not found: ${symbol}`,
    );
  }

  return quote;
}

export interface MADUnderlyingPriceReference {
  symbol: string;
  currency: string;

  bid: string;
  ask: string;

  bidE6: bigint;
  askE6: bigint;
  midpointE6: bigint;

  spreadE6: bigint;

  isTradingHalt: boolean;
  generatedAt: string;

  dailyTradingVolume: string;
}

export function normaliseRobinhoodPrice(
  quote: RobinhoodPriceQuote,
): MADUnderlyingPriceReference {
  const bidE6 =
    parseUnits(quote.bid, 6);

  const askE6 =
    parseUnits(quote.ask, 6);

  if (bidE6 < 0n || askE6 < 0n) {
    throw new Error(
      "Robinhood bid and ask must not be negative",
    );
  }

  if (askE6 < bidE6) {
    throw new Error(
      "Robinhood ask must not be below bid",
    );
  }

  return {
    symbol: quote.tokenSymbol,
    currency: quote.currency,

    bid: quote.bid,
    ask: quote.ask,

    bidE6,
    askE6,

    midpointE6:
      (bidE6 + askE6) / 2n,

    spreadE6:
      askE6 - bidE6,

    isTradingHalt:
      quote.isTradingHalt,

    generatedAt:
      quote.generatedAt,

    dailyTradingVolume:
      quote.dailyTradingVolume,
  };
}
