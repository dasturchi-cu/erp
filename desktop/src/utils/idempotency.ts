import { getRandomUUID } from './uuid';

export function newIdempotencyKey(): string {
  return getRandomUUID();
}
