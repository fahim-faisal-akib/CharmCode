const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs-extra");
const { readConfig, writeConfig } = require("../utils/config");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ---------------------------------------------------------------------------
// File reader
// ---------------------------------------------------------------------------
async function readProjectFiles(projectDir) {
  if (!projectDir || !fs.existsSync(projectDir)) return null;

  const TEXT_EXTS = new Set([
    "js","jsx","ts","tsx","py","java","c","cpp","cs","go","rs","rb","php",
    "html","css","scss","sass","less","json","yaml","yml","toml","env",
    "md","txt","sh","bat","ps1","sql","graphql","vue","svelte","xml",
    "gitignore","prettierrc","eslintrc","babelrc","editorconfig",
  ]);
  const SKIP_DIRS = new Set([
    "node_modules",".git","dist","build",".next","__pycache__",
    ".venv","venv","vendor","coverage",".turbo",
  ]);
  const MAX_FILE  = 40 * 1024;  // 40kb per file
  const MAX_TOTAL = 80 * 1024;  // 80kb total — keeps well under token limits

  const files = [];
  let totalSize = 0;

  function walk(dir, relBase) {
    let entries;
    try { entries = fs.readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      if (entry.startsWith(".") && entry !== ".env") continue;
      const full = path.join(dir, entry);
      const rel  = relBase ? `${relBase}/${entry}` : entry;
      let stat;
      try { stat = fs.statSync(full); } catch { continue; }
      if (stat.isDirectory()) {
        if (!SKIP_DIRS.has(entry)) walk(full, rel);
      } else {
        const ext = entry.includes(".") ? entry.split(".").pop().toLowerCase() : entry.toLowerCase();
        if (!TEXT_EXTS.has(ext)) continue;
        if (stat.size > MAX_FILE) continue;
        if (totalSize + stat.size > MAX_TOTAL) continue;
        try {
          const content = fs.readFileSync(full, "utf8");
          files.push({ path: rel, content });
          totalSize += stat.size;
        } catch { continue; }
      }
    }
  }

  walk(projectDir, "");
  if (files.length === 0) return null;

  return `## Project files (${files.length} files)\n\n` +
    files.map(f => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n");
}

// ---------------------------------------------------------------------------
// Decide whether the user message needs file context injected
// ---------------------------------------------------------------------------
function needsFileContext(userMessage) {
  if (!userMessage) return false;
  const msg = userMessage.toLowerCase();
  const keywords = [
    "fix","bug","error","broken","issue","problem","debug","crash","fail",
    "edit","update","change","modify","refactor","rewrite","improve",
    "create","build","write","generate","make","implement",
    "file","function","class","component","api","route","import","export",
    "read","look","check","review","analyze","explain this","what does",
    "my project","my code","my app","the code","this code","the file","add",
  ];
  return keywords.some(kw => msg.includes(kw));
}

// ---------------------------------------------------------------------------
// System prompt builder — only injects files when relevant
// ---------------------------------------------------------------------------
async function buildSystemPrompt(projectDir, userMessage) {
  const base = `You are OpenCode, an expert AI coding assistant.

Always respond with ONLY a valid JSON object — no text outside it:
{
  "thought": "brief reasoning",
  "actions": [
    { "type": "create_file", "path": "relative/path/file.ext", "content": "full file content" },
    { "type": "edit_file",   "path": "relative/path/file.ext", "content": "complete updated content" },
    { "type": "create_dir",  "path": "relative/path/dir" },
    { "type": "delete_file", "path": "relative/path/file.ext" },
    { "type": "message",     "content": "markdown answer or explanation" }
  ]
}

Project directory: ${projectDir || "(not set)"}
All file paths are RELATIVE to the project directory.
Rules: always write complete file contents, never use placeholders like "...", write production-quality code, include README.md when scaffolding.`;

  if (!projectDir || !needsFileContext(userMessage)) {
    return base;
  }

  const projectContext = await readProjectFiles(projectDir);
  if (!projectContext) return base;

  const combined = base + "\n\n---\n" + projectContext;

  // If still too large, just list file names without content
  if (combined.length > 14000) {
    const fileNames = projectContext
      .split("\n")
      .filter(l => l.startsWith("### "))
      .map(l => l.replace("### ", ""))
      .join(", ");
    return base + `\n\nProject files (content too large to include, ask user to share specific files): ${fileNames}`;
  }

  return combined;
}

// ---------------------------------------------------------------------------
// Sanitize messages — strip any extra fields, ensure non-empty content
// ---------------------------------------------------------------------------
function sanitizeMessages(msgs) {
  if (!Array.isArray(msgs)) return [];
  return msgs
    .map(m => ({
      role: ["system","assistant","user"].includes(m.role) ? m.role : "user",
      content: typeof m.content === "string" ? m.content.trim() : String(m.content ?? ""),
    }))
    .filter(m => m.content.length > 0);
}

// ---------------------------------------------------------------------------
// OpenRouter caller with key fallback
// ---------------------------------------------------------------------------
async function callOpenRouter(messages, model, options = {}) {
  const config = readConfig();
  const keys = (config.openrouterKeys || []).filter(Boolean);
  if (keys.length === 0) throw new Error("No OpenRouter API keys configured.");

  let lastError = null;
  const startIdx = config.openrouterActiveIndex || 0;

  for (let i = 0; i < keys.length; i++) {
    const idx = (startIdx + i) % keys.length;
    const apiKey = keys[idx];
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://opencode.local",
          "X-Title": "OpenCode",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens || 8192,
          temperature: options.temperature ?? 0.2,
        }),
        timeout: 180000,
      });

      if (res.ok) {
        const data = await res.json();
        if (idx !== startIdx) { config.openrouterActiveIndex = idx; writeConfig(config); }
        return { content: data.choices[0]?.message?.content || "", model: data.model, usage: data.usage, keyUsed: idx + 1, provider: "openrouter" };
      }
      const err = await res.json().catch(() => ({}));
      lastError = err.error?.message || `HTTP ${res.status}`;
      console.warn(`[OpenRouter key ${idx+1}] ${lastError}`);
      if (res.status === 400 || res.status === 422) throw new Error(`Bad request: ${lastError}`);
    } catch (e) {
      if (e.message.startsWith("Bad request:")) throw e;
      lastError = e.message;
      console.warn(`[OpenRouter key ${idx+1}] exception: ${e.message}`);
    }
  }
  throw new Error(`All OpenRouter keys failed. Last: ${lastError}`);
}

// ---------------------------------------------------------------------------
// Groq caller with key fallback
// ---------------------------------------------------------------------------
async function callGroq(messages, model, options = {}) {
  const config = readConfig();
  const keys = (config.groqKeys || []).filter(Boolean);
  if (keys.length === 0) throw new Error("No Groq API keys configured.");

  let lastError = null;
  const startIdx = config.groqActiveIndex || 0;

  for (let i = 0; i < keys.length; i++) {
    const idx = (startIdx + i) % keys.length;
    const apiKey = keys[idx];
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.2,
        }),
        timeout: 120000,
      });

      if (res.ok) {
        const data = await res.json();
        if (idx !== startIdx) { config.groqActiveIndex = idx; writeConfig(config); }
        return { content: data.choices[0]?.message?.content || "", model: data.model, usage: data.usage, keyUsed: idx + 1, provider: "groq" };
      }
      const err = await res.json().catch(() => ({}));
      lastError = err.error?.message || `HTTP ${res.status}`;
      console.warn(`[Groq key ${idx+1}] ${lastError}`);
      if (res.status === 400 || res.status === 422) throw new Error(`Bad request: ${lastError}`);
    } catch (e) {
      if (e.message.startsWith("Bad request:")) throw e;
      lastError = e.message;
      console.warn(`[Groq key ${idx+1}] exception: ${e.message}`);
    }
  }
  throw new Error(`All Groq keys failed. Last: ${lastError}`);
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
async function callWithFallback(messages, model, options = {}) {
  const config = readConfig();
  if (!model) throw new Error("No model selected. Choose a model in Settings.");
  const provider = config.activeProvider || "openrouter";
  if (provider === "groq") return callGroq(messages, model, options);
  return callOpenRouter(messages, model, options);
}

module.exports = { callWithFallback, buildSystemPrompt, sanitizeMessages };
