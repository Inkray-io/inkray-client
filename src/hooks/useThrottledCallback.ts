import { useCallback, useEffect, useRef } from "react";

/**
 * useThrottledCallback (trailing throttle)
 * Returns a throttled and memoized function. Cancels pending calls on dependency change.
 * @param callback - The function to throttle
 * @param deps - Dependency array
 * @param throttleNumber - Throttle interval in ms
 */
export function useThrottledCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  deps: unknown[],
  throttleNumber: number
): (...args: Args) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);
  const pendingArgsRef = useRef<Args | null>(null);
  const isTrailingRef = useRef(false);

  // Cancel any pending call if dependencies change
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      pendingArgsRef.current = null;
      isTrailingRef.current = false;
    }
    lastInvokeTimeRef.current = 0;
  }, deps);

  const throttledFn = useCallback(
    (...args: Args) => {
      const now = Date.now();
      const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
      if (
        lastInvokeTimeRef.current === 0 ||
        timeSinceLastInvoke >= throttleNumber
      ) {
        // Leading edge: call immediately
        callback(...args);
        lastInvokeTimeRef.current = now;
        isTrailingRef.current = false;
        // Schedule trailing if more calls come in
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        // Within throttle window: schedule trailing call
        pendingArgsRef.current = args;
        if (!isTrailingRef.current) {
          isTrailingRef.current = true;
          const remaining = throttleNumber - timeSinceLastInvoke;
          timeoutRef.current = setTimeout(() => {
            if (pendingArgsRef.current) {
              callback(...pendingArgsRef.current);
              lastInvokeTimeRef.current = Date.now();
              pendingArgsRef.current = null;
            }
            timeoutRef.current = null;
            isTrailingRef.current = false;
          }, remaining);
        }
      }
    },
    [callback, throttleNumber, ...deps]
  );

  return throttledFn;
}
