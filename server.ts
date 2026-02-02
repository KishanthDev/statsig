import express from "express";
import dotenv from "dotenv";
import { TeladocStatsig } from "./statsig";
import { TeladocUser } from "./teladoc-user"; // ⭐ use your wrapper

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
    userID: userId, // ⭐ ALWAYS string
    country: (req.query.country as string) ?? "US",
    custom: {
      plan: (req.query.plan as string) ?? "free",
    },
  });
}


//
// 1️⃣ Feature Gate
//
app.get("/gate/:key", async (req, res) => {
  const enabled = await rollout.checkGate(req.params.key, buildUser(req));
  res.json({ enabled });
});

//
// 2️⃣ Dynamic Config
//
app.get("/config/:key", async (req, res) => {
  const value = await rollout.getConfig(req.params.key, buildUser(req));
  res.json(value);
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
