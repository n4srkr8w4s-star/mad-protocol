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
