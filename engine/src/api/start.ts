import { createMADApi } from "./server.js";

const PORT = Number(
  process.env.MAD_API_PORT ??
    process.env.PORT ??
    "3000",
);

const HOST =
  process.env.MAD_API_HOST ?? "127.0.0.1";

const app = createMADApi();

try {
  await app.listen({
    port: PORT,
    host: HOST,
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
