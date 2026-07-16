import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { VectorLaneConfig } from "./types.js";
import { ConfigError } from "./errors.js";

const CONFIG_DIR = join(homedir(), ".vectorlane");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function getDefaultConfig(): VectorLaneConfig {
  return {
    defaultCollection: "default",
    defaultProvider: "local-hash",
    defaultModel: "local-hash",
    storeDir: CONFIG_DIR,
    apiPort: 3777,
    requireAuth: false,
    authToken: "",
  };
}

export async function loadConfig(): Promise<VectorLaneConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<VectorLaneConfig>;
    const defaults = getDefaultConfig();
    return { ...defaults, ...parsed };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ENOENT") {
      return getDefaultConfig();
    }
    throw new ConfigError("Failed to load config", { path: CONFIG_FILE, cause: err });
  }
}

export async function saveConfig(config: VectorLaneConfig): Promise<void> {
  try {
    await mkdir(CONFIG_DIR, { recursive: true });
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    throw new ConfigError("Failed to save config", { path: CONFIG_FILE, cause: err });
  }
}

export async function getConfigValue<K extends keyof VectorLaneConfig>(key: K): Promise<VectorLaneConfig[K]> {
  const config = await loadConfig();
  return config[key];
}

export async function setConfigValue<K extends keyof VectorLaneConfig>(
  key: K,
  value: VectorLaneConfig[K]
): Promise<void> {
  const config = await loadConfig();
  config[key] = value;
  await saveConfig(config);
}
