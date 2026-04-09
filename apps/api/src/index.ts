import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_URL ?? "http://localhost:3000",
  credentials: true,
});

// Health check
app.get("/health", async () => ({ status: "ok", service: "silog-api" }));

// Routes will be registered here as we build them
// app.register(import('./routes/v1/users.js'), { prefix: '/api/v1' })

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
