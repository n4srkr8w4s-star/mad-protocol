export type MarketAvailability =
  | "OPEN"
  | "CLOSED"
  | "UNKNOWN";

function getEasternParts(
  unixSeconds: bigint,
): {
  weekday: string;
  hour: number;
  minute: number;
} {
  const date =
    new Date(
      Number(unixSeconds) * 1000,
    );

  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/New_York",

        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      },
    );

  const parts =
    formatter.formatToParts(date);

  const value = (
    type: string,
  ): string => {
    const part =
      parts.find(
        (item) =>
          item.type === type,
      );

    if (!part) {
      throw new Error(
        `Missing date part: ${type}`,
      );
    }

    return part.value;
  };

  return {
    weekday:
      value("weekday"),

    hour:
      Number(value("hour")),

    minute:
      Number(value("minute")),
  };
}

export function evaluateMarketAvailability(
  marketHours: string | null,
  unixSeconds: bigint,
): MarketAvailability {
  if (
    marketHours !==
    "us_equities_24/5"
  ) {
    return "UNKNOWN";
  }

  const {
    weekday,
    hour,
    minute,
  } = getEasternParts(
    unixSeconds,
  );

  const minuteOfDay =
    hour * 60 + minute;

  const OPEN_SUNDAY =
    20 * 60;

  const CLOSE_FRIDAY =
    20 * 60;

  if (weekday === "Sat") {
    return "CLOSED";
  }

  if (weekday === "Sun") {
    return minuteOfDay >=
      OPEN_SUNDAY
      ? "OPEN"
      : "CLOSED";
  }

  if (weekday === "Fri") {
    return minuteOfDay <
      CLOSE_FRIDAY
      ? "OPEN"
      : "CLOSED";
  }

  return "OPEN";
}
