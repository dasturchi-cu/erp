import { useCallback, useRef } from 'react';
import { newIdempotencyKey } from '@/utils/idempotency';

/**
 * One Idempotency-Key per user operation. `get()` creates it on first submit
 * and returns the same key for every retry (e.g. after a timeout whose request
 * may have succeeded server-side); call `reset()` once the operation succeeded
 * so the next one gets a fresh key. The server forgets keys of failed requests,
 * so retrying with the same key after a real error is safe.
 */
export function useIdempotencyKey() {
  const ref = useRef<string | null>(null);
  const get = useCallback(() => {
    if (!ref.current) ref.current = newIdempotencyKey();
    return ref.current;
  }, []);
  const reset = useCallback(() => {
    ref.current = null;
  }, []);
  return { get, reset };
}
