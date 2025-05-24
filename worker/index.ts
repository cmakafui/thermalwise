// worker/index.ts - Updated with UploadThing integration
import { Hono } from "hono";
import { cors } from "hono/cors";
import { agentsMiddleware } from "hono-agents";
import { createRouteHandler } from "uploadthing/server";
import { uploadRouter } from "./uploadthing";
import { ThermalAnalysisAgent } from "./agents/thermal-analysis";
import type { Env } from "./types";

export { ThermalAnalysisAgent };

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use("/*", cors());

// Use the agents middleware
app.use("*", agentsMiddleware());

// Health check endpoint
app.get("/api/hello", (c) => {
  return c.json({
    message: "Hello from ThermalWise API!",
    timestamp: new Date().toISOString(),
  });
});

// UploadThing route handler
app.all("/api/uploadthing", async (c) => {
  const handlers = createRouteHandler({
    router: uploadRouter,
    config: {
      token: c.env.UPLOADTHING_TOKEN,
      isDev: c.env.ENVIRONMENT === "development",
      // Cloudflare Workers compatibility
      fetch: (url, init) => {
        if (init && "cache" in init) delete init.cache;
        return fetch(url, init);
      },
    },
  });

  return await handlers(c.req.raw);
});

export default app;
