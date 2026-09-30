import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Bun only auto-loads `.env` from the current working directory, so running
// the server from anywhere except `server/` leaves DATABASE_URL/JWT_SECRET
// unset. Load `server/.env` relative to the entrypoint instead (existing
// process environment always wins), keeping `bun run src/index.ts` working
// from any directory.
function findServerRoot(startDir: string): string | null {
  let dir = startDir;

  while (true) {
    if (existsSync(join(dir, "package.json")) && existsSync(join(dir, ".env"))) {
      return dir;
    }

    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function parseDotEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) return null;

  const withoutExport = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length).trim()
    : trimmed;
  const separatorIndex = withoutExport.indexOf("=");

  if (separatorIndex <= 0) return null;

  const key = withoutExport.slice(0, separatorIndex).trim();
  let value = withoutExport.slice(separatorIndex + 1).trim();

  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1);
  }

  if (!key || key.includes(" ")) return null;

  return [key, value];
}

export function loadServerEnv(): void {
  const candidates = [dirname(Bun.main), process.cwd()];

  for (const candidate of candidates) {
    const serverRoot = findServerRoot(candidate);

    if (!serverRoot) continue;

    const contents = readFileSync(join(serverRoot, ".env"), "utf8");

    for (const line of contents.split("\n")) {
      const parsed = parseDotEnvLine(line);

      if (!parsed) continue;

      const [key, value] = parsed;

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }

    return;
  }
}

loadServerEnv();
