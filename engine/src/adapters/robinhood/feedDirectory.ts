import {
  getAddress,
} from "viem";

const ROBINHOOD_FEED_DIRECTORY_URL =
  "https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json";

export interface RobinhoodFeedMetadata {
  name: string;

  proxyAddress: string;
  contractAddress: string;
  secondaryProxyAddress: string | null;

  heartbeatSeconds: number;
  threshold: number | null;
  decimals: number;

  assetClass: string | null;
  assetSubClass: string | null;
  baseAsset: string | null;
  quoteAsset: string | null;
  marketHours: string | null;
  productType: string | null;
  productTypeCode: string | null;
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

function findByProxyAddress(
  value: unknown,
  targetAddress: string,
): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const match =
        findByProxyAddress(
          item,
          targetAddress,
        );

      if (match) {
        return match;
      }
    }

    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const proxyAddress =
    value.proxyAddress;

  if (
    typeof proxyAddress === "string" &&
    proxyAddress.toLowerCase() ===
      targetAddress.toLowerCase()
  ) {
    return value;
  }

  for (const child of Object.values(value)) {
    const match =
      findByProxyAddress(
        child,
        targetAddress,
      );

    if (match) {
      return match;
    }
  }

  return undefined;
}

function findPrimaryTokenizedPriceFeedsBySymbol(
  value: unknown,
  symbol: string,
  matches: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      findPrimaryTokenizedPriceFeedsBySymbol(
        item,
        symbol,
        matches,
      );
    }

    return matches;
  }

  if (!isRecord(value)) {
    return matches;
  }

  const docs =
    isRecord(value.docs)
      ? value.docs
      : null;

  if (
    docs &&
    typeof value.proxyAddress === "string" &&
    typeof docs.baseAsset === "string" &&
    typeof docs.quoteAsset === "string" &&
    typeof docs.productTypeCode === "string" &&
    docs.baseAsset.toUpperCase() ===
      symbol.toUpperCase() &&
    docs.quoteAsset.toUpperCase() === "USD" &&
    docs.productTypeCode ===
      "primaryTokenizedPrice"
  ) {
    matches.push(value);
  }

  for (const child of Object.values(value)) {
    findPrimaryTokenizedPriceFeedsBySymbol(
      child,
      symbol,
      matches,
    );
  }

  return matches;
}

export function parseRobinhoodFeedMetadata(
  payload: unknown,
  proxyAddress: string,
): RobinhoodFeedMetadata {
  const canonicalProxy =
    getAddress(proxyAddress);

  const entry =
    findByProxyAddress(
      payload,
      canonicalProxy,
    );

  if (!entry) {
    throw new Error(
      `Robinhood feed not found in directory: ${canonicalProxy}`,
    );
  }

  if (
    typeof entry.name !== "string" ||
    typeof entry.contractAddress !== "string" ||
    typeof entry.proxyAddress !== "string" ||
    typeof entry.heartbeat !== "number" ||
    typeof entry.decimals !== "number"
  ) {
    throw new Error(
      `Invalid Robinhood feed directory entry: ${canonicalProxy}`,
    );
  }

  if (
    !Number.isInteger(entry.heartbeat) ||
    entry.heartbeat <= 0
  ) {
    throw new Error(
      `Invalid heartbeat for Robinhood feed: ${canonicalProxy}`,
    );
  }

  if (
    !Number.isInteger(entry.decimals) ||
    entry.decimals < 0
  ) {
    throw new Error(
      `Invalid decimals for Robinhood feed: ${canonicalProxy}`,
    );
  }

  const docs =
    isRecord(entry.docs)
      ? entry.docs
      : {};

  return {
    name:
      entry.name,

    proxyAddress:
      getAddress(entry.proxyAddress),

    contractAddress:
      getAddress(entry.contractAddress),

    secondaryProxyAddress:
      typeof entry.secondaryProxyAddress ===
      "string"
        ? getAddress(
            entry.secondaryProxyAddress,
          )
        : null,

    heartbeatSeconds:
      entry.heartbeat,

    threshold:
      typeof entry.threshold === "number"
        ? entry.threshold
        : null,

    decimals:
      entry.decimals,

    assetClass:
      typeof docs.assetClass === "string"
        ? docs.assetClass
        : null,

    assetSubClass:
      typeof docs.assetSubClass === "string"
        ? docs.assetSubClass
        : null,

    baseAsset:
      typeof docs.baseAsset === "string"
        ? docs.baseAsset
        : null,

    quoteAsset:
      typeof docs.quoteAsset === "string"
        ? docs.quoteAsset
        : null,

    marketHours:
      typeof docs.marketHours === "string"
        ? docs.marketHours
        : null,

    productType:
      typeof docs.productType === "string"
        ? docs.productType
        : null,

    productTypeCode:
      typeof docs.productTypeCode === "string"
        ? docs.productTypeCode
        : null,
  };
}

export function parseRobinhoodFeedMetadataBySymbol(
  payload: unknown,
  symbol: string,
): RobinhoodFeedMetadata {
  const canonicalSymbol =
    symbol.trim().toUpperCase();

  if (!canonicalSymbol) {
    throw new Error(
      "Robinhood feed symbol is required",
    );
  }

  const matches =
    findPrimaryTokenizedPriceFeedsBySymbol(
      payload,
      canonicalSymbol,
    );

  if (matches.length === 0) {
    throw new Error(
      `Robinhood primary tokenized price feed not found for: ${canonicalSymbol}`,
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Ambiguous Robinhood primary tokenized price feeds for: ${canonicalSymbol}`,
    );
  }

  const proxyAddress =
    matches[0]?.proxyAddress;

  if (typeof proxyAddress !== "string") {
    throw new Error(
      `Invalid Robinhood feed directory entry for: ${canonicalSymbol}`,
    );
  }

  return parseRobinhoodFeedMetadata(
    payload,
    proxyAddress,
  );
}

export async function fetchRobinhoodFeedMetadata(
  proxyAddress: string,
  fetchFn: typeof fetch = fetch,
): Promise<RobinhoodFeedMetadata> {
  const response =
    await fetchFn(
      ROBINHOOD_FEED_DIRECTORY_URL,
      {
        headers: {
          accept: "application/json",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      `Robinhood feed directory request failed: HTTP ${response.status}`,
    );
  }

  const payload: unknown =
    await response.json();

  return parseRobinhoodFeedMetadata(
    payload,
    proxyAddress,
  );
}


export async function fetchRobinhoodFeedMetadataBySymbol(
  symbol: string,
  fetchFn: typeof fetch = fetch,
): Promise<RobinhoodFeedMetadata> {
  const response =
    await fetchFn(
      ROBINHOOD_FEED_DIRECTORY_URL,
      {
        headers: {
          accept: "application/json",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      `Robinhood feed directory request failed: HTTP ${response.status}`,
    );
  }

  const payload: unknown =
    await response.json();

  return parseRobinhoodFeedMetadataBySymbol(
    payload,
    symbol,
  );
}
