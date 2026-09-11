import { useEffect, useMemo } from "react";
import { VideoTexture, LinearFilter, SRGBColorSpace } from "three";

export function useVideoTexture(url: string) {
  const video = useMemo(() => {
    const el = document.createElement("video");
    el.src = url;
    el.crossOrigin = "anonymous";
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.autoplay = true;
    el.play().catch(() => {});
    return el;
  }, [url]);

  const texture = useMemo(() => {
    const tex = new VideoTexture(video);
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [video]);

  useEffect(() => {
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      texture.dispose();
    };
  }, [video, texture]);

  return texture;
}
