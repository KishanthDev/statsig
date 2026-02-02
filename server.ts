import express from "express";
import dotenv from "dotenv";
import { TeladocStatsig } from "./statsig";
import { TeladocUser } from "./teladoc-user";

dotenv.config();

const app = express();
app.use(express.json());

const rollout = new TeladocStatsig({
  token: process.env.STATSIG_SERVER_SECRET!,
  environment: { tier: "development" },
});

//Initialize before starting server
(async () => {
  await rollout.initialize();
  console.log("✅ Statsig initialized");

  /**
   * helper user builder
   */
  function buildUser(req: express.Request): TeladocUser {
    const userId =
      typeof req.query.userId === "string" && req.query.userId.length > 0
        ? req.query.userId
        : "guest";

    return new TeladocUser({
      userID: userId,
      country: (req.query.country as string) ?? "US",
      custom: {
        plan: (req.query.plan as string) ?? "free",
      },
    });
  }

  // 1️⃣ Feature Gate (synchronous in new SDK)
  app.get("/gate/:name", (req, res) => {
    try {
      const enabled = rollout.checkGate(req.params.name, buildUser(req));
      res.json({ enabled });
    } catch (error) {
      console.error("Gate error:", error);
      res.status(500).json({ error: "Failed to check gate" });
    }
  });

  // 2️⃣ Dynamic Config (synchronous in new SDK)
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

  // 3️⃣ Parameter Store (synchronous in new SDK)
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

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received: closing HTTP server");
    await rollout.shutdown();
    process.exit(0);
  });

  app.listen(3000, () => {
    console.log("🚀 http://localhost:3000");
  });
})();
