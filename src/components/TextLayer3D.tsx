"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "troika-three-text";

export function TextLayer3D({
  content,
  fontUrl,
  position,
  color = "#ffffff",
  fontSize = 0.5,
}: {
  content: string;
  fontUrl?: string;
  position: [number, number, number];
  color?: string;
  fontSize?: number;
}) {
  const textObj = useMemo(() => {
    const text = new Text();
    text.text = content;
    if (fontUrl) {
      text.font = fontUrl;
    }
    text.fontSize = fontSize;
    text.color = color;
    text.anchorX = "center";
    text.anchorY = "middle";
    text.sync();
    return text;
  }, [content, fontUrl, color, fontSize]);

  useEffect(() => {
    return () => {
      textObj.dispose();
    };
  }, [textObj]);

  useFrame(() => {
    textObj.sync();
  });

  return <primitive object={textObj} position={position} />;
}
