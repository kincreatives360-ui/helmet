import type { ParamField, AssetSlot } from "./types";

export type TemplateMetadata = {
  id: string;
  name: string;
  thumbnail: string;
  durationSeconds: number;
  paramSchema: ParamField[];
  assetSlots: AssetSlot[];
};

export const templateSchemas: TemplateMetadata[] = [
  {
    id: "tube",
    name: "Image Tube",
    thumbnail: "/templates/tube.jpg",
    durationSeconds: 6,
    paramSchema: [
      { key: "rows", label: "Rows", type: "number", min: 1, max: 20, step: 1, default: 5 },
      { key: "cols", label: "Columns", type: "number", min: 3, max: 40, step: 1, default: 12 },
      { key: "radius", label: "Radius", type: "number", min: 1, max: 10, step: 0.1, default: 4 },
      { key: "baseSpeed", label: "Speed", type: "number", min: 0, max: 1, step: 0.01, default: 0.25 },
    ],
    assetSlots: [
      { id: "images", label: "Media Stream", type: "image", multiple: true },
      { id: "text", label: "3D Text Layer", type: "text", multiple: false },
      { id: "centerpiece", label: "Logo", type: "logo", multiple: false },
    ],
  },
  {
    id: "sphere",
    name: "Image Sphere",
    thumbnail: "/templates/sphere.jpg",
    durationSeconds: 6,
    paramSchema: [
      { key: "count", label: "Image Count", type: "number", min: 6, max: 60, step: 1, default: 24 },
      { key: "radius", label: "Radius", type: "number", min: 1, max: 10, step: 0.1, default: 4 },
    ],
    assetSlots: [
      { id: "images", label: "Media Stream", type: "image", multiple: true },
      { id: "text", label: "3D Text Layer", type: "text", multiple: false },
      { id: "centerpiece", label: "Logo", type: "logo", multiple: false },
    ],
  },
  {
    id: "rubens",
    name: "Rubens",
    thumbnail: "/templates/rubens.jpg",
    durationSeconds: 6,
    paramSchema: [
      { key: "count", label: "Image Count", type: "number", min: 6, max: 60, step: 1, default: 24 },
    ],
    assetSlots: [
      { id: "images", label: "Media Stream", type: "image", multiple: true },
      { id: "text", label: "3D Text Layer", type: "text", multiple: false },
      { id: "centerpiece", label: "Logo", type: "logo", multiple: false },
    ],
  },
];

export function getDefaultParams(templateId: string): Record<string, number | string | boolean> {
  const tpl = templateSchemas.find((t) => t.id === templateId);
  if (!tpl) return {};
  const defaults: Record<string, number | string | boolean> = {};
  tpl.paramSchema.forEach((field) => {
    defaults[field.key] = field.default;
  });
  return defaults;
}
