import {
  describe,
  expect,
  it,
} from "vitest";

import {
  evaluateMarketAvailability,
} from "../src/engine/marketHours.js";

function unix(
  iso: string,
): bigint {
  return BigInt(
    Math.floor(
      Date.parse(iso) / 1000,
    ),
  );
}

describe(
  "Robinhood market hours",
  () => {
    it("is open during the weekday 24/5 window", () => {
      expect(
        evaluateMarketAvailability(
          "us_equities_24/5",
          unix(
            "2026-09-04T08:40:00Z",
          ),
        ),
      ).toBe("OPEN");
    });

    it("closes after Friday 8 PM ET", () => {
      expect(
        evaluateMarketAvailability(
          "us_equities_24/5",
          unix(
            "2026-09-05T01:00:00Z",
          ),
        ),
      ).toBe("CLOSED");
    });

    it("remains closed on Saturday", () => {
      expect(
        evaluateMarketAvailability(
          "us_equities_24/5",
          unix(
            "2026-09-05T12:00:00Z",
          ),
        ),
      ).toBe("CLOSED");
    });

    it("opens Sunday at 8 PM ET", () => {
      expect(
        evaluateMarketAvailability(
          "us_equities_24/5",
          unix(
            "2026-09-07T00:30:00Z",
          ),
        ),
      ).toBe("OPEN");
    });

    it("returns UNKNOWN for unsupported market-hours semantics", () => {
      expect(
        evaluateMarketAvailability(
          "something_else",
          unix(
            "2026-09-04T08:40:00Z",
          ),
        ),
      ).toBe("UNKNOWN");
    });
  },
);
