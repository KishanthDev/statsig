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

/**
 * helper user builder
 * now returns TeladocUser
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

// 1️⃣ Feature Gate
app.get("/gate/:name", async (req, res) => {
  const enabled = await rollout.checkGate(req.params.name, buildUser(req));
  res.json({ enabled });
});

// 2️⃣ Dynamic Config & Param Store
// Supports: GET /config/ui_settings?key=header_color
// Supports: GET /config/ui_settings (returns full JSON)
app.get("/config/:name", async (req, res) => {
  const configName = req.params.name;
  
  // Extract optional key from query params
  const specificKey = req.query.key as string | undefined; 
  const user = buildUser(req);

  // Pass specificKey to our updated method
  const result = await rollout.getConfig(configName, user, specificKey);
  
  res.json(result);
});

//
// 3️⃣ Param Store
//
app.get("/params/:key", async (req, res) => {
  const params = await rollout.getConfig(req.params.key, buildUser(req));
  res.json(params);
});

app.listen(3000, () => {
  console.log("🚀 http://localhost:3000");
});