import { useCallback } from "react";

/**
 * Returns true if the frame was handled deterministically (auto mode) — caller should
 * skip its own interactive physics update for this frame when this returns true.
 */
export function useDeterministicAngle(
  angleRef: React.MutableRefObject<number>,
  playbackMode: "interactive" | "auto",
  progress: number,
  totalRotations = 1.5,
) {
  return useCallback(() => {
    if (playbackMode !== "auto") return false;
    angleRef.current = progress * Math.PI * 2 * totalRotations;
    return true;
  }, [angleRef, playbackMode, progress, totalRotations]);
}
