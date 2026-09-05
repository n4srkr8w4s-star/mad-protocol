import {
  scanRobinhoodUniverse,
} from "../engine/scanRobinhoodUniverse.js";

const result =
  await scanRobinhoodUniverse();

console.log(
  "\nMAD ROBINHOOD UNIVERSE\n",
);

console.log(
  "Generated:",
  result.generatedAt,
);

console.log(
  "\nCOUNTS",
);

console.log(
  "Discovered:   ",
  result.counts.discovered,
);

console.log(
  "FULL:         ",
  result.counts.full,
);

console.log(
  "PARTIAL:      ",
  result.counts.partial,
);

console.log(
  "DISCOVERABLE: ",
  result.counts.discoverable,
);

console.log(
  "Ambiguous:    ",
  result.counts.ambiguousFeeds,
);

console.log(
  "\nASSETS",
);

for (const item of result.assets) {
  const asset =
    item.capability;

  console.log(
    [
      asset.symbol.padEnd(8),
      asset.capability.padEnd(12),
      `${asset.supportedDisorders}/${asset.totalDisorders}`.padEnd(6),
      item.feedResolution.padEnd(10),
      asset.name,
    ].join(" "),
  );
}
