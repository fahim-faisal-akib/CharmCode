const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { readConfig, writeConfig } = require("../utils/config");

// GET all settings (masks keys)
router.get("/", (req, res) => {
  try {
    const c = readConfig();
    const mask = (k) => k ? "***" + k.slice(-4) : "";
    res.json({
      ...c,
      openrouterKeysMasked: (c.openrouterKeys || []).map(mask),
      groqKeysMasked: (c.groqKeys || []).map(mask),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET raw config (used by frontend store)
router.get("/raw", (req, res) => {
  try { res.json(readConfig()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT openrouter keys
router.put("/openrouter-keys", (req, res) => {
  try {
    const { keys } = req.body;
    if (!Array.isArray(keys) || keys.length !== 5)
      return res.status(400).json({ error: "Must provide exactly 5 key slots" });
    const c = readConfig();
    c.openrouterKeys = keys;
    c.openrouterActiveIndex = 0;
    writeConfig(c);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT groq keys
router.put("/groq-keys", (req, res) => {
  try {
    const { keys } = req.body;
    if (!Array.isArray(keys) || keys.length !== 5)
      return res.status(400).json({ error: "Must provide exactly 5 key slots" });
    const c = readConfig();
    c.groqKeys = keys;
    c.groqActiveIndex = 0;
    writeConfig(c);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT openrouter models
router.put("/openrouter-models", (req, res) => {
  try {
    const { models, activeModel, activeProvider } = req.body;
    const c = readConfig();
    if (models !== undefined) c.openrouterModels = models;
    if (activeModel !== undefined) c.activeModel = activeModel;
    if (activeProvider !== undefined) c.activeProvider = activeProvider;
    writeConfig(c);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT groq models
router.put("/groq-models", (req, res) => {
  try {
    const { models, activeModel, activeProvider } = req.body;
    const c = readConfig();
    if (models !== undefined) c.groqModels = models;
    if (activeModel !== undefined) c.activeModel = activeModel;
    if (activeProvider !== undefined) c.activeProvider = activeProvider;
    writeConfig(c);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT active provider + model
router.put("/active", (req, res) => {
  try {
    const { activeProvider, activeModel } = req.body;
    const c = readConfig();
    if (activeProvider) c.activeProvider = activeProvider;
    if (activeModel !== undefined) c.activeModel = activeModel;
    writeConfig(c);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT project directory
router.put("/project-dir", (req, res) => {
  try {
    const { projectDir } = req.body;
    if (!projectDir) return res.status(400).json({ error: "projectDir required" });
    const c = readConfig();
    c.projectDir = projectDir;
    writeConfig(c);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST test a key
router.post("/test-key", async (req, res) => {
  try {
    const { apiKey, provider } = req.body;
    if (!apiKey) return res.status(400).json({ error: "apiKey required" });

    if (provider === "groq") {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3-8b-8192", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
      });
      if (response.ok) return res.json({ valid: true });
      const err = await response.json().catch(() => ({}));
      return res.json({ valid: false, error: err.error?.message || "Invalid key" });
    }

    // openrouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://opencode.local",
        "X-Title": "OpenCode",
      },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
    });
    if (response.ok) return res.json({ valid: true });
    const err = await response.json().catch(() => ({}));
    return res.json({ valid: false, error: err.error?.message || "Invalid key" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

// PUT theme
router.put("/theme", (req, res) => {
  try {
    const { theme } = req.body;
    const c = readConfig(); c.theme = theme; writeConfig(c);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT projects
router.put("/projects", (req, res) => {
  try {
    const { projects, activeProjectId, projectDir } = req.body;
    const c = readConfig();
    if (projects !== undefined) c.projects = projects;
    if (activeProjectId !== undefined) c.activeProjectId = activeProjectId;
    if (projectDir !== undefined) c.projectDir = projectDir;
    writeConfig(c);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT chats
router.put("/chats", (req, res) => {
  try {
    const { chats, activeChatId } = req.body;
    const c = readConfig();
    if (chats !== undefined) c.chats = chats;
    if (activeChatId !== undefined) c.activeChatId = activeChatId;
    writeConfig(c);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
