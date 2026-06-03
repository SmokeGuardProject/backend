export function getCorsOrigin(): string | string[] | boolean {
  const configuredOrigin = process.env.CORS_ORIGIN?.trim();

  if (!configuredOrigin || configuredOrigin === '*') {
    return true;
  }

  const origins = configuredOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}
