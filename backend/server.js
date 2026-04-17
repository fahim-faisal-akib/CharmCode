require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");

const settingsRouter = require("./routes/settings");
const agentRouter    = require("./routes/agent");
const filesRouter    = require("./routes/files");

const app = express();
const PORT = process.env.PORT || 3001;
const CONFIG_PATH = path.join(__dirname, "config.json");

const DEFAULT_CONFIG = {
  openrouterKeys:   ["","","","",""],
  openrouterActiveIndex: 0,
  openrouterModels: [],
  groqKeys:         ["","","","",""],
  groqActiveIndex:  0,
  groqModels:       [],
  activeProvider:   "openrouter",
  activeModel:      "",
  theme:            "dark",
  projects:         [],
  activeProjectId:  null,
  projectDir:       "",
  chats:            [],
  activeChatId:     null,
};

if (!fs.existsSync(CONFIG_PATH)) {
  fs.writeJsonSync(CONFIG_PATH, DEFAULT_CONFIG, { spaces: 2 });
} else {
  const cfg = fs.readJsonSync(CONFIG_PATH);
  let changed = false;
  // migrate old schema
  if (cfg.apiKeys && !cfg.openrouterKeys) {
    cfg.openrouterKeys = cfg.apiKeys;
    cfg.openrouterActiveIndex = cfg.activeKeyIndex || 0;
    cfg.openrouterModels = cfg.models || [];
    delete cfg.apiKeys; delete cfg.activeKeyIndex; delete cfg.models;
    changed = true;
  }
  for (const [k,v] of Object.entries(DEFAULT_CONFIG)) {
    if (cfg[k] === undefined) { cfg[k] = v; changed = true; }
  }
  if (changed) fs.writeJsonSync(CONFIG_PATH, cfg, { spaces: 2 });
}

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "20mb" }));

app.use("/api/settings", settingsRouter);
app.use("/api/agent",    agentRouter);
app.use("/api/files",    filesRouter);
app.get("/api/health",   (_, res) => res.json({ status:"ok", version:"3.0.0" }));

app.listen(PORT, () => {
  console.log(`\n  OpenCode v3 backend → http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to stop.\n`);
}).on("error", err => {
  if (err.code === "EADDRINUSE") console.error(`\n  Port ${PORT} already in use.\n`);
  else console.error(`\n  Server error:`, err.message);
  process.exit(1);
});
process.on("uncaughtException", err => console.error("\n  Error:", err.message));
