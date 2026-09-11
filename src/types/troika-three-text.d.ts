declare module "troika-three-text" {
  import { Mesh, Material, Color } from "three";

  export class Text extends Mesh {
    text: string;
    font?: string;
    fontSize: number;
    color: string | number | Color;
    anchorX: number | "left" | "center" | "right";
    anchorY: number | "top" | "top-baseline" | "middle" | "bottom-baseline" | "bottom";
    curveRadius?: number;
    direction?: "auto" | "ltr" | "rtl";
    textAlign?: "left" | "right" | "center" | "justify";
    lineHeight?: number | "normal";
    letterSpacing?: number;
    whiteSpace?: "normal" | "nowrap";
    overflowWrap?: "normal" | "break-word";
    maxWidth?: number;
    depthOffset?: number;
    clipRect?: [number, number, number, number];
    material?: Material;
    sync(callback?: () => void): void;
    dispose(): void;
  }
}
