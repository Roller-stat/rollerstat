type EnvironmentMode = "LOCAL" | "PROD";

function normalizeMode(value: string | undefined): EnvironmentMode | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "PROD" || normalized === "PRODUCTION") {
    return "PROD";
  }

  if (normalized === "LOCAL" || normalized === "DEV" || normalized === "DEVELOPMENT") {
    return "LOCAL";
  }

  return null;
}

export function resolveEnvironmentMode(): EnvironmentMode {
  const explicit = normalizeMode(process.env.ENV);
  if (explicit) {
    return explicit;
  }

  return process.env.NODE_ENV === "production" ? "PROD" : "LOCAL";
}

export function resolveWebBaseUrl(): string {
  if (resolveEnvironmentMode() === "PROD") {
    return "https://rollerstat.com";
  }

  return "http://localhost:3000";
}

export function resolveWebAuthUrl(): string {
  return resolveWebBaseUrl();
}
