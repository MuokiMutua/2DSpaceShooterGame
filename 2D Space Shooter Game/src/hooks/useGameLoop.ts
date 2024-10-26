import { useEffect, useRef, useCallback } from 'react';

export function useGameLoop(callback: () => void, fps: number = 60) {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const loop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const elapsed = timestamp - lastTimeRef.current;
    const interval = 1000 / fps;

    if (elapsed >= interval) {
      callbackRef.current();
      lastTimeRef.current = timestamp - (elapsed % interval);
    }

    frameRef.current = requestAnimationFrame(loop);
  }, [fps]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [loop]);
}