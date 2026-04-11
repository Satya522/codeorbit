import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { install } = require("njre");

const supportedPlatforms = new Set(["linux", "win32"]);
const javaExecutableName = process.platform === "win32" ? "java.exe" : "java";
const runtimeRoot = path.join(process.cwd(), "vendor", "java", `${process.platform}-${process.arch}`);
const runtimeManifestPath = path.join(runtimeRoot, "package.json");
const vendoredJavaPath = path.join(runtimeRoot, "jre", "bin", javaExecutableName);

function hasSystemJava() {
  const probe = spawnSync("java", ["-version"], {
    stdio: "ignore",
    windowsHide: true,
  });

  return !probe.error && probe.status === 0;
}

async function main() {
  if (!supportedPlatforms.has(process.platform)) {
    return;
  }

  if (existsSync(vendoredJavaPath)) {
    return;
  }

  if (process.platform === "win32" && hasSystemJava()) {
    return;
  }

  mkdirSync(runtimeRoot, { recursive: true });
  writeFileSync(
    runtimeManifestPath,
    JSON.stringify(
      {
        description: "Portable Java runtime for CodeOrbit playground LSP.",
        name: "codeorbit-java-runtime",
        private: true,
        version: "1.0.0",
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`[CodeOrbit] Installing portable Java runtime for ${process.platform}-${process.arch}...`);

  await install(21, {
    installPath: runtimeManifestPath,
    type: "jre",
    vendor: "eclipse",
  });

  if (!existsSync(vendoredJavaPath)) {
    throw new Error(`Portable Java runtime installation completed without ${vendoredJavaPath}.`);
  }
}

main().catch((error) => {
  console.error("[CodeOrbit] Unable to prepare Java runtime for playground completions.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
