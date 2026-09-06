import {
  useEffect,
  useState,
} from "react";

import {
  MAD_API_BASE_URL,
} from "../config/api.js";

export interface SearchResult {
  symbol: string;
  name: string;
  isin: string;
  address: string;
  chainId: number;
  status: string;
  logoUrl: string;
  monitoring:
    | "FULL"
    | "PARTIAL"
    | "DISCOVERABLE";

  supportedDisorders: number;
  totalDisorders: number;

  feedResolution:
    | "RESOLVED"
    | "MISSING"
    | "AMBIGUOUS";
}

interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

interface AssetSearchProps {
  onSelectAsset?: (
    result: SearchResult,
  ) => void;
}

const SEARCH_URL =
  `${MAD_API_BASE_URL}/api/v1/assets/search`;

export function AssetSearch({
  onSelectAsset,
}: AssetSearchProps) {
  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<SearchResult[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
              `${SEARCH_URL}?q=${encodeURIComponent(
                trimmed,
              )}`,
              {
                cache: "no-store",
                signal:
                  controller.signal,
              },
            );

          if (!response.ok) {
            throw new Error(
              `Search failed: HTTP ${response.status}`,
            );
          }

          const payload =
            (await response.json()) as SearchResponse;

          setResults(
            payload.results,
          );

          setError(null);
        } catch (err) {
          if (
            err instanceof DOMException &&
            err.name === "AbortError"
          ) {
            return;
          }

          setError(
            err instanceof Error
              ? err.message
              : "Search unavailable",
          );
        } finally {
          setLoading(false);
        }
      },
      250,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function selectResult(
    result: SearchResult,
  ) {
    onSelectAsset?.(
      result,
    );

    setQuery("");
    setResults([]);
  }

  return (
    <div className="asset-search">
      <div className="search-box">
        <span className="search-symbol">
          ⌕
        </span>

        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder="Search Robinhood Stock Tokens"
          aria-label="Search Robinhood Stock Tokens"
          autoComplete="off"
        />

        {loading && (
          <span className="search-loading">
            SEARCHING
          </span>
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="search-results">
          {error && (
            <div className="search-message">
              {error}
            </div>
          )}

          {!error &&
            !loading &&
            results.length === 0 && (
              <div className="search-message">
                No Robinhood Stock Token found
              </div>
            )}

          {results.map(
            (result) => (
              <button
                type="button"
                key={result.address}
                className={`search-result ${
                  result.monitoring ===
                  "FULL"
                    ? "search-result-full"
                    : ""
                }`}
                onClick={() =>
                  selectResult(
                    result,
                  )
                }
              >
                <img
                  src={
                    result.logoUrl
                  }
                  alt=""
                />

                <div className="search-result-main">
                  <strong>
                    {
                      result.symbol
                    }
                  </strong>

                  <span>
                    {result.name}
                  </span>
                </div>

                <div className="search-result-meta">
                  <span>
                    {result.status}
                  </span>

                  <b
                    className={
                      result.monitoring ===
                      "FULL"
                        ? "monitoring-full"
                        : "monitoring-discoverable"
                    }
                  >
                    {
                      result.monitoring
                    }
                  </b>
                </div>
              </button>
            ),
          )}

          {results.some(
            (result) =>
              result.monitoring !==
              "FULL",
          ) && (
            <div className="search-footnote">
              FULL = all current MAD disorder
              classes structurally supported.
              PARTIAL = some MAD assessments
              are available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
