import "dotenv/config";
import express from "express";
import cors from "cors";
import { waitForDb } from "./db.js";
import { initSchema } from "./schema.js";
import authRoutes from "./routes/auth.js";
import groupRoutes from "./routes/groups.js";
import assignmentRoutes from "./routes/assignments.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();
const origin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "joineazy-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

const port = Number(process.env.PORT || 4000);

waitForDb()
  .then(initSchema)
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start API", err);
    process.exit(1);
  });
