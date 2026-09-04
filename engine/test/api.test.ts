import { afterEach, describe, expect, it } from "vitest";

import { createMADApi } from "../src/api/server.js";

const REGISTRY =
  "0x65605F7169ec0dA7aEF8178A8b7d69159b43B222";

const TPONS =
  "0x9B35982C720e18d84cC9D84C6c20FA9cc45b8d36";

afterEach(() => {
  delete process.env.MAD_REGISTRY;
  delete process.env.ROBINHOOD_TESTNET_RPC;
});

describe("MAD API", () => {
  it("reports service health", async () => {
    const app = createMADApi({
      logger: false,
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      service: "MAD API",
      status: "ok",
    });

    await app.close();
  });

  it("lists monitored assets", async () => {
    const app = createMADApi({
      logger: false,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/assets",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.assets).toHaveLength(1);
    expect(body.assets[0]).toMatchObject({
      id: "tpons",
      symbol: "tPONS",
      type: "TEST_ASSET",
      chainId: 46630,
      address: TPONS,
    });

    await app.close();
  });

  it("returns 404 for an unknown asset", async () => {
    const app = createMADApi({
      logger: false,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/assets/unknown/state",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: "MAD_ASSET_NOT_FOUND",
      message:
        "The requested asset is not monitored by MAD.",
    });

    await app.close();
  });

  it("returns a canonical MAD state snapshot", async () => {
    process.env.MAD_REGISTRY = REGISTRY;
    process.env.ROBINHOOD_TESTNET_RPC =
      "https://example.invalid";

    const app = createMADApi({
      logger: false,

      readSnapshot: async () => ({
        asset: {
          address: TPONS,
          supported: true,
        },

        mad: {
          score: 0,
          severityCode: 0,
          severity: "NORMAL",
          isDisordered: false,
          disorderBitmap: "0",
          activeDisorders: [],
          sequence: "2",
        },

        provenance: {
          evidenceHash:
            "0x00b878b730a95559fa4554cac0a3a428cf9a9286f0489a2f34c70bfa1b376e95",
          rulesetHash:
            "0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69",
          updatedAtUnix: "1788487226",
          updatedAtIso:
            "2026-09-04T02:00:26.000Z",
        },

        network: {
          name: "Robinhood Chain Testnet",
          chainId: 46630,
          registry: REGISTRY,
        },
      }),
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/assets/tpons/state",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.asset).toMatchObject({
      id: "tpons",
      symbol: "tPONS",
      name: "PONS Test Asset",
      type: "TEST_ASSET",
      address: TPONS,
      chainId: 46630,
    });

    expect(body.mad).toMatchObject({
      score: 0,
      severity: "NORMAL",
      isDisordered: false,
      disorderBitmap: "0",
      sequence: "2",
    });

    expect(body.provenance.rulesetHash).toBe(
      "0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69",
    );

    await app.close();
  });
});
