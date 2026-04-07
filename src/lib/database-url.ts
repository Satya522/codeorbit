function readEnv(key: string) {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

function encodePart(value: string) {
  return encodeURIComponent(value);
}

export function resolveDatabaseUrl() {
  const directUrl = readEnv("DATABASE_URL");

  if (directUrl) {
    return directUrl;
  }

  const host = readEnv("POSTGRES_HOST");
  const port = readEnv("POSTGRES_PORT");
  const database = readEnv("POSTGRES_DB");
  const user = readEnv("POSTGRES_USER");
  const password = readEnv("POSTGRES_PASSWORD");

  const hasParts = Boolean(host || port || database || user || password);

  if (!hasParts) {
    return undefined;
  }

  const resolvedHost = host ?? "127.0.0.1";
  const resolvedPort = port ?? "5432";
  const resolvedDatabase = database ?? "codeorbit";
  const resolvedUser = user ?? "postgres";
  const resolvedPassword = password ?? "";
  const credentials = resolvedPassword
    ? `${encodePart(resolvedUser)}:${encodePart(resolvedPassword)}`
    : encodePart(resolvedUser);

  return `postgresql://${credentials}@${resolvedHost}:${resolvedPort}/${encodePart(resolvedDatabase)}`;
}

export function hasDatabaseConfig() {
  return Boolean(resolveDatabaseUrl());
}
