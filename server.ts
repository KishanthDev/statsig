import express, { Request } from "express";
import dotenv from "dotenv";
import { TeladocStatsig } from "./statsig";
import { TeladocUser } from "./teladoc-user";

dotenv.config();

/* --------------------------------------------------
   Validate environment
-------------------------------------------------- */
const token = process.env.STATSIG_SERVER_SECRET;
if (!token) {
  throw new Error("❌ STATSIG_SERVER_SECRET missing in .env");
}

/* --------------------------------------------------
   App setup
-------------------------------------------------- */
const app = express();
app.use(express.json());

const rollout = new TeladocStatsig({
  token,
  environment: { tier: "development" },
});

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

/**
 * Build Statsig user from request
 * Keeps route handlers clean
 */
function buildUser(req: Request): TeladocUser {
  return new TeladocUser({
    userID: String(req.query.userId ?? "guest"),
    country: String(req.query.country ?? "US"),
    custom: {
      plan: String(req.query.plan ?? "free"),
    },
  });
}

/* --------------------------------------------------
   Routes
-------------------------------------------------- */

/**
 * Feature Gate
 * GET /gate/:name
 */
app.get("/gate/:name", (req, res) => {
  try {
    const enabled = rollout.checkGate(req.params.name, buildUser(req));
    res.json({ enabled });
    } catch (error) {
      console.error("Gate error:", error);
    res.status(500).json({ error: "Failed to check gate" });
  }
});

/**
 * Dynamic Config
 * GET /config/:name
 * GET /config/:name?key=timeout
 */
app.get("/config/:name", (req, res) => {
  try {
          const configName = req.params.name;
      const specificKey = req.query.key as string | undefined;
      const user = buildUser(req);

      const result = rollout.getConfig(configName, user, specificKey);

      res.json(result);
    } catch (error) {
      console.error("Config error:", error);
    res.status(500).json({ error: "Failed to get config" });
  }
});

/**
 * Parameter Store
 * GET /params/:name
 * GET /params/:name?key=timeout
 */
app.get("/params/:name", (req, res) => {
  try {
      const paramName = req.params.name;
      const specificKey = req.query.key as string | undefined;
      const user = buildUser(req);
      
      const value = rollout.getParameterStore(paramName, user, specificKey);

      res.json({ parameter: paramName, value });
    } catch (error) {
      console.error("Parameter Store error:", error);
    res.status(500).json({ error: "Failed to get parameter" });
  }
});

/* --------------------------------------------------
   Graceful shutdown
-------------------------------------------------- */
process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down server...");
  await rollout.shutdown();
  process.exit(0);
});

/* --------------------------------------------------
   Start server
-------------------------------------------------- */
async function startServer() {
  await rollout.initialize();
  console.log("✅ Statsig initialized");

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}`);
  });
}

startServer();
