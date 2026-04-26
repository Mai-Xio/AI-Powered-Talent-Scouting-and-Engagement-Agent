import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: "0" };
const result = spawnSync(command, ["playwright", "install", "chromium"], {
  stdio: "inherit",
  env
});

process.exit(result.status ?? 1);
