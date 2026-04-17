const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs-extra");
const { readConfig } = require("../utils/config");

// GET /api/files/tree - get directory tree of project
router.get("/tree", async (req, res) => {
  try {
    const config = readConfig();
    const projectDir = config.projectDir;
    if (!projectDir) return res.json({ tree: null, message: "No project directory set" });
    if (!fs.existsSync(projectDir)) return res.json({ tree: null, message: "Project directory does not exist" });

    const tree = buildTree(projectDir, projectDir);
    res.json({ tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/read - read a file
router.get("/read", async (req, res) => {
  try {
    const { filePath } = req.query;
    if (!filePath) return res.status(400).json({ error: "filePath required" });

    const config = readConfig();
    const fullPath = path.join(config.projectDir, filePath);

    // Security: ensure path stays within project dir
    if (!fullPath.startsWith(config.projectDir)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const content = await fs.readFile(fullPath, "utf8");
    res.json({ content, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/create - create a file or directory manually
router.post("/create", async (req, res) => {
  try {
    const { filePath, content, isDir } = req.body;
    if (!filePath) return res.status(400).json({ error: "filePath required" });

    const config = readConfig();
    if (!config.projectDir) return res.status(400).json({ error: "No project directory set" });

    const fullPath = path.join(config.projectDir, filePath);
    if (!fullPath.startsWith(config.projectDir)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (isDir) {
      await fs.ensureDir(fullPath);
    } else {
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content || "", "utf8");
    }

    res.json({ success: true, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/delete - delete a file or directory
router.delete("/delete", async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: "filePath required" });

    const config = readConfig();
    const fullPath = path.join(config.projectDir, filePath);
    if (!fullPath.startsWith(config.projectDir)) {
      return res.status(403).json({ error: "Access denied" });
    }

    await fs.remove(fullPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildTree(rootDir, currentDir, depth = 0) {
  if (depth > 6) return null;
  const items = fs.readdirSync(currentDir);
  const children = [];

  for (const item of items) {
    if (item.startsWith(".") || item === "node_modules" || item === "__pycache__") continue;
    const fullPath = path.join(currentDir, item);
    const relativePath = path.relative(rootDir, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subtree = buildTree(rootDir, fullPath, depth + 1);
      children.push({ name: item, path: relativePath, type: "dir", children: subtree?.children || [] });
    } else {
      children.push({ name: item, path: relativePath, type: "file", size: stat.size });
    }
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { name: path.basename(currentDir), path: "", type: "dir", children };
}

module.exports = router;
