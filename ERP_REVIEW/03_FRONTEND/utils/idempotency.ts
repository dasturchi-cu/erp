export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
