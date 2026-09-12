import gsap from "gsap";

export const EASING_OPTIONS = [
  "power1.inOut",
  "power2.out",
  "power3.out",
  "sine.inOut",
  "expo.inOut",
  "back.out(1.7)",
  "elastic.out(1, 0.3)",
  "bounce.out",
  "linear",
] as const;

export type EasingPreset = (typeof EASING_OPTIONS)[number];

/**
 * Returns the eased progress value [0..1] given a linear progress [0..1]
 * and a GSAP ease string name.
 */
export function getEasedProgress(linearProgress: number, easeName?: string): number {
  if (!easeName || easeName === "linear" || easeName === "none") {
    return linearProgress;
  }
  try {
    const easeFn = gsap.parseEase(easeName);
    if (typeof easeFn === "function") {
      return easeFn(linearProgress);
    }
  } catch (e) {
    console.warn("Failed to parse GSAP ease:", easeName, e);
  }
  return linearProgress;
}
