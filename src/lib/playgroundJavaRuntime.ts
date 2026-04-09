const commonJavaImportPackages = [
  "java.io",
  "java.math",
  "java.nio.file",
  "java.time",
  "java.util",
  "java.util.concurrent",
  "java.util.stream",
] as const;

const javaImportLinePattern = /^\s*import\s+[\w.*]+\s*;\s*$/;
const javaPackageLinePattern = /^\s*package\s+[\w.]+\s*;\s*$/;

function codeAlreadyImportsJavaPackage(code: string, packageName: string) {
  const escapedPackageName = packageName.replace(/\./g, "\\.");
  const importPattern = new RegExp(
    `^\\s*import\\s+${escapedPackageName}(?:\\.[A-Za-z0-9_*]+)?\\s*;\\s*$`,
    "m",
  );

  return importPattern.test(code);
}

export function prepareJavaForExecution(code: string) {
  const missingImports = commonJavaImportPackages
    .filter((packageName) => !codeAlreadyImportsJavaPackage(code, packageName))
    .map((packageName) => `import ${packageName}.*;`);

  if (missingImports.length === 0) {
    return code;
  }

  const newline = code.includes("\r\n") ? "\r\n" : "\n";
  const lines = code.split(/\r?\n/);
  let insertAt = 0;

  for (const [index, line] of lines.entries()) {
    if (javaPackageLinePattern.test(line) || javaImportLinePattern.test(line)) {
      insertAt = index + 1;
    }
  }

  const before = lines.slice(0, insertAt).join(newline).trimEnd();
  const after = lines.slice(insertAt).join(newline).trimStart();
  const sections = [before, missingImports.join(newline), after].filter((section) => section.length > 0);

  return sections.join(`${newline}${newline}`);
}
