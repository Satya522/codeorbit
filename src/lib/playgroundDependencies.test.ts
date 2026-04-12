import { describe, expect, it } from "vitest";
import {
  buildRuntimeDependencyWorkspaceFiles,
  detectRuntimeImports,
  mergeManagedDependenciesWithDetectedImports,
} from "@/lib/playgroundDependencies";

describe("playground dependencies", () => {
  it("detects external and builtin JavaScript imports separately", () => {
    const imports = detectRuntimeImports(
      "javascript",
      'import fs from "node:fs";\nimport axios from "axios";\nconst local = require("./local");',
    );

    expect(imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          canAutoAdd: false,
          kind: "builtin",
          packageName: "fs",
          specifier: "node:fs",
        }),
        expect.objectContaining({
          canAutoAdd: true,
          kind: "external",
          packageName: "axios",
          specifier: "axios",
        }),
        expect.objectContaining({
          canAutoAdd: false,
          kind: "relative",
          specifier: "./local",
        }),
      ]),
    );
  });

  it("maps common Python imports to installable package names", () => {
    const imports = detectRuntimeImports("python", "import os\nimport cv2\nfrom sklearn.model_selection import train_test_split\n");

    expect(imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          canAutoAdd: false,
          kind: "builtin",
          packageName: "os",
        }),
        expect.objectContaining({
          canAutoAdd: true,
          kind: "external",
          packageName: "opencv-python",
          specifier: "cv2",
        }),
        expect.objectContaining({
          canAutoAdd: true,
          kind: "external",
          packageName: "scikit-learn",
          specifier: "sklearn.model_selection",
        }),
      ]),
    );
  });

  it("auto-merges addable imports into managed dependencies", () => {
    const merged = mergeManagedDependenciesWithDetectedImports(
      "go",
      [],
      'package main\n\nimport (\n  "fmt"\n  "github.com/gin-gonic/gin"\n)\n',
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      name: "gin",
      specifier: "github.com/gin-gonic/gin",
    });
  });

  it("builds package metadata files for JavaScript and Java", () => {
    const packageFiles = buildRuntimeDependencyWorkspaceFiles(
      "javascript",
      [{ id: "dep-1", name: "axios", specifier: "axios@1.8.4" }],
      (...segments) => `file:///playground/${segments.join("/")}`,
    );
    const javaFiles = buildRuntimeDependencyWorkspaceFiles(
      "java",
      [{ id: "dep-2", name: "gson", specifier: "com.google.code.gson:gson:2.11.0" }],
      (...segments) => `file:///playground/${segments.join("/")}`,
    );

    expect(packageFiles[0]?.value).toContain('"axios": "1.8.4"');
    expect(javaFiles[0]?.value).toContain("<artifactId>gson</artifactId>");
  });
});
