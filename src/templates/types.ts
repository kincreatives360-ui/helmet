import type { ComponentType } from "react";

export type ParamField =
  | { key: string; label: string; type: "number"; min: number; max: number; step: number; default: number }
  | { key: string; label: string; type: "select"; options: string[]; default: string }
  | { key: string; label: string; type: "color"; default: string }
  | { key: string; label: string; type: "boolean"; default: boolean }
  | { key: string; label: string; type: "string"; default: string; placeholder?: string };

export type AssetSlot = {
  id: string;
  label: string;
  type: "image" | "video" | "text" | "audio" | "logo";
  multiple: boolean; // e.g. tube needs many images, a logo slot needs exactly one
};

export type TemplateSceneProps = {
  playbackMode?: "interactive" | "auto";
  progress?: number; // 0–1, only used when playbackMode === "auto"
};

export type TemplateDefinition = {
  id: string;
  name: string;
  thumbnail: string; // static preview image, e.g. /templates/tube.jpg
  durationSeconds: number; // for "auto" playback / export
  paramSchema: ParamField[];
  assetSlots: AssetSlot[];
  SceneComponent: ComponentType<TemplateSceneProps>;
};
