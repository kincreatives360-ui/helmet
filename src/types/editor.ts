export type SlotAsset =
  | { kind: "image"; id: string; url: string; name: string }
  | { kind: "video"; id: string; url: string; name: string }
  | { kind: "text"; id: string; content: string; fontUrl?: string; fontName?: string }
  | { kind: "audio"; id: string; url: string; name: string };

export type ImageAsset = {
  id: string;
  url: string; // object URL or remote URL
  name: string;
};

export type CanvasPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
};

export type CenterpieceLogo = {
  kind: "svg" | "png";
  raw: string; // svg markup, or data URL for png
};

export type EditorState = {
  activeTemplateId: string | null;
  assetsBySlot: Record<string, SlotAsset[]>; // keyed by AssetSlot.id
  templateParams: Record<string, number | string | boolean>;
  canvasSize: { width: number; height: number };
  centerpieceLogo: CenterpieceLogo | null;
  images: ImageAsset[];
  tubeParams: { rows: number; cols: number; radius: number; baseSpeed: number };
  activePreset: "tube" | "sphere" | "rubens";
};
