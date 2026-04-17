const express = require("express");
const router  = express.Router();
const path    = require("path");
const fs      = require("fs-extra");
const { callWithFallback, buildSystemPrompt, sanitizeMessages } = require("../services/agent");
const { readConfig } = require("../utils/config");

// ─────────────────────────────────────────────────────────────────────────────
// Rough token estimator: ~4 chars per token (good enough for budgeting)
// ─────────────────────────────────────────────────────────────────────────────
function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Trim conversation history to fit inside a token budget.
//
// Strategy:
//   1. Always keep the last N message pairs (user+assistant) — recent context
//      is most important.
//   2. Trim AI messages that contain large code blocks (they balloon the count).
//   3. Never drop the very first user message (gives the AI overall context).
//   4. Stay under MAX_HISTORY_TOKENS regardless of conversation length.
// ─────────────────────────────────────────────────────────────────────────────
function trimHistory(history, systemPromptTokens, provider) {
  // Per-provider token budgets (leave headroom for response)
  const TOTAL_BUDGET = provider === "groq" ? 5000 : 28000;
  const MAX_HISTORY_TOKENS = TOTAL_BUDGET - systemPromptTokens - 800; // 800 for the new user msg + response

  if (!history || history.length === 0) return [];

  // Sanitize first (strip extra fields, empty messages)
  const clean = sanitizeMessages(history);
  if (clean.length === 0) return [];

  // Trim oversized assistant messages — keep first 800 chars of each
  const trimmed = clean.map(m => {
    if (m.role === "assistant" && m.content.length > 800) {
      return { ...m, content: m.content.slice(0, 800) + "\n[…trimmed for context window…]" };
    }
    return m;
  });

  // Walk backwards, collecting messages until budget runs out
  // Always keep at least the last 2 messages (1 user + 1 assistant pair)
  const kept = [];
  let usedTokens = 0;
  const MIN_KEEP = Math.min(4, trimmed.length); // always keep last 4 messages

  for (let i = trimmed.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(trimmed[i].content);
    const isMandatory = i >= trimmed.length - MIN_KEEP;

    if (isMandatory || usedTokens + msgTokens <= MAX_HISTORY_TOKENS) {
      kept.unshift(trimmed[i]);
      usedTokens += msgTokens;
    }
    // else: skip this older message to save tokens
  }

  return kept;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const { messages, conversationHistory } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    const config = readConfig();
    const provider = config.activeProvider || "openrouter";

    // Current user message text
    const userMessage = messages.find(m => m.role === "user")?.content || "";

    // Build system prompt (smart — only injects files when relevant)
    const systemPromptText = await buildSystemPrompt(config.projectDir, userMessage);
    const systemTokens = estimateTokens(systemPromptText);

    // Trim history to fit token budget
    const trimmedHistory = trimHistory(conversationHistory, systemTokens, provider);

    // Build final message list
    const fullMessages = sanitizeMessages([
      { role: "system", content: systemPromptText },
      ...trimmedHistory,
      ...messages,
    ]);

    if (!fullMessages.some(m => m.role === "user")) {
      return res.status(400).json({ error: "No valid user message found." });
    }

    // Log token estimate for debugging
    const totalEstimate = fullMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    console.log(`[Agent] ~${totalEstimate} tokens | provider=${provider} | history=${trimmedHistory.length} msgs (trimmed from ${(conversationHistory||[]).length})`);

    const result = await callWithFallback(fullMessages, config.activeModel);

    // Parse JSON response from model
    let parsed;
    try {
      const cleaned = result.content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { thought: "", actions: [{ type: "message", content: result.content }] };
    }

    // Execute file actions
    const executedActions = [];
    for (const action of (parsed.actions || [])) {
      try {
        if ((action.type === "create_file" || action.type === "edit_file") && config.projectDir) {
          const fp = path.join(config.projectDir, action.path);
          await fs.ensureDir(path.dirname(fp));
          await fs.writeFile(fp, action.content || "", "utf8");
          executedActions.push({ ...action, executed: true });
        } else if (action.type === "create_dir" && config.projectDir) {
          await fs.ensureDir(path.join(config.projectDir, action.path));
          executedActions.push({ ...action, executed: true });
        } else if (action.type === "delete_file" && config.projectDir) {
          await fs.remove(path.join(config.projectDir, action.path));
          executedActions.push({ ...action, executed: true });
        } else {
          executedActions.push(action);
        }
      } catch (fileErr) {
        console.error(`[Agent] File action error:`, fileErr.message);
        executedActions.push({ ...action, error: fileErr.message });
      }
    }

    res.json({
      thought:  parsed.thought || "",
      actions:  executedActions,
      model:    result.model,
      usage:    result.usage,
      keyUsed:  result.keyUsed,
      provider: result.provider,
    });
  } catch (err) {
    console.error("[Agent] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
