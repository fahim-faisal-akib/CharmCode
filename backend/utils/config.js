const path = require("path");
const fs = require("fs-extra");

const CONFIG_PATH = path.join(__dirname, "..", "config.json");

function readConfig() {
  return fs.readJsonSync(CONFIG_PATH);
}

function writeConfig(data) {
  fs.writeJsonSync(CONFIG_PATH, data, { spaces: 2 });
}

module.exports = { readConfig, writeConfig, CONFIG_PATH };
