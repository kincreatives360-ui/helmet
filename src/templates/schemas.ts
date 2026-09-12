import type { ParamField, AssetSlot } from "./types";
import { EASING_OPTIONS } from "../lib/easing";

export type TemplateMetadata = {
  id: string;
  name: string;
  thumbnail: string;
  durationSeconds: number;
  paramSchema: ParamField[];
  assetSlots: AssetSlot[];
};

const animationFields: ParamField[] = [
  {
    key: "easing",
    label: "Animation Easing",
    type: "select",
    options: [...EASING_OPTIONS],
    default: "power1.inOut",
  },
];

const textFields: ParamField[] = [
  // textTitle removed - content now lives only in the Asset panel's "3D Text Layer" slot
  { key: "textFontSize", label: "Text Size", type: "number", min: 0.1, max: 3, step: 0.05, default: 0.6 },
  { key: "textColor", label: "Text Color", type: "color", default: "#e2ba80" },
  { key: "textPositionX", label: "Text Position X", type: "number", min: -10, max: 10, step: 0.1, default: 0 },
  { key: "textPositionY", label: "Text Position Y", type: "number", min: -10, max: 10, step: 0.1, default: 0 },
  { key: "textPositionZ", label: "Text Position Z", type: "number", min: -5, max: 5, step: 0.1, default: 0.5 },
];

const centerpieceFields: ParamField[] = [
  // Extrusion Settings
  { key: "logoDepth", label: "Logo Extrusion Depth", type: "number", min: 1, max: 30, step: 0.5, default: 8 },
  { key: "logoBevelEnabled", label: "Logo Bevel Enabled", type: "boolean", default: true },
  { key: "logoBevelThickness", label: "Logo Bevel Thickness", type: "number", min: 0.05, max: 5, step: 0.05, default: 1 },
  { key: "logoBevelSize", label: "Logo Bevel Size", type: "number", min: 0.05, max: 5, step: 0.05, default: 0.5 },
  { key: "logoBevelSegments", label: "Logo Bevel Segments", type: "number", min: 1, max: 10, step: 1, default: 2 },
  { key: "logoCurveSegments", label: "Logo Curve Smoothness", type: "number", min: 4, max: 32, step: 1, default: 12 },

  // Transform/Positioning Settings
  { key: "logoScale", label: "Logo Scale", type: "number", min: 0.2, max: 10, step: 0.1, default: 2 },
  { key: "logoPositionX", label: "Logo Position X", type: "number", min: -10, max: 10, step: 0.1, default: 0 },
  { key: "logoPositionY", label: "Logo Position Y", type: "number", min: -10, max: 10, step: 0.1, default: 0 },
  { key: "logoPositionZ", label: "Logo Position Z", type: "number", min: -10, max: 10, step: 0.1, default: 0 },
  { key: "logoRotationX", label: "Logo Rotation X", type: "number", min: -180, max: 180, step: 1, default: 0 },
  { key: "logoRotationY", label: "Logo Rotation Y", type: "number", min: -180, max: 180, step: 1, default: 0 },
  { key: "logoRotationZ", label: "Logo Rotation Z", type: "number", min: -180, max: 180, step: 1, default: 0 },

  // Material Settings (PBR)
  { key: "logoColor", label: "Logo Color", type: "color", default: "#ffffff" },
  { key: "logoMetalness", label: "Logo Metalness", type: "number", min: 0, max: 1, step: 0.05, default: 0.1 },
  { key: "logoRoughness", label: "Logo Roughness", type: "number", min: 0, max: 1, step: 0.05, default: 0 },
  { key: "logoTransmission", label: "Logo Transmission (Glass)", type: "number", min: 0, max: 1, step: 0.05, default: 1 },
  { key: "logoThickness", label: "Logo Thickness (Glass Refraction)", type: "number", min: 0, max: 20, step: 0.5, default: 10 },
  { key: "logoIor", label: "Logo Index of Refraction (IOR)", type: "number", min: 1, max: 2.333, step: 0.05, default: 1.9 },
  { key: "logoClearcoat", label: "Logo Clearcoat", type: "number", min: 0, max: 1, step: 0.05, default: 0.1 },
  { key: "logoClearcoatRoughness", label: "Logo Clearcoat Roughness", type: "number", min: 0, max: 2, step: 0.05, default: 1.1 },

  // Dynamic Motion & Hover Float
  { key: "logoFloatEnabled", label: "Centerpiece Hover Float", type: "boolean", default: true },
  { key: "logoFloatSpeed", label: "Hover Float Speed", type: "number", min: 0.2, max: 4, step: 0.1, default: 1.5 },
  { key: "logoFloatAmplitude", label: "Hover Float Height", type: "number", min: 0.01, max: 0.3, step: 0.01, default: 0.08 },
  { key: "logoSpinSpeed", label: "Centerpiece Idle Spin", type: "number", min: -2, max: 2, step: 0.1, default: 0 },
];

const backgroundFields: ParamField[] = [
  { key: "showGrid", label: "Show Grid", type: "boolean", default: true },
  { key: "transparentBackground", label: "Transparent Background", type: "boolean", default: false },
  { key: "backgroundColor", label: "Background Color", type: "color", default: "#000000" },
  { key: "gridScale", label: "Grid Scale", type: "number", min: 4, max: 64, step: 1, default: 28 },
  { key: "gridLineWidth", label: "Grid Line Width", type: "number", min: 0.1, max: 2, step: 0.05, default: 0.5 },
  { key: "gridColor", label: "Grid Color", type: "color", default: "#1a1a1a" },
  { key: "environmentPreset", label: "Environment", type: "select", options: ["none", "studio", "city", "sunset", "dawn", "night"], default: "studio" },
  { key: "environmentBlur", label: "Environment Blur", type: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
  { key: "cameraParallax", label: "Camera Parallax Drift", type: "number", min: 0, max: 1, step: 0.05, default: 0.3 },
];

export function buildParamSchema(customFields: ParamField[], centerpieceDefaultsOverwrites?: Record<string, number | string | boolean>): ParamField[] {
  const fields = [
    ...animationFields,
    ...customFields,
    ...textFields,
    ...centerpieceFields,
    ...backgroundFields,
  ];

  if (centerpieceDefaultsOverwrites) {
    return fields.map((field) => {
      if (field.key in centerpieceDefaultsOverwrites) {
        return { ...field, default: centerpieceDefaultsOverwrites[field.key] } as ParamField;
      }
      return field;
    });
  }
  return fields;
}

const rubensCenterpieceDefaults = {
  logoColor: "#613309",
  logoMetalness: 0.9,
  logoRoughness: 0.3,
  logoTransmission: 0,
  logoThickness: 0,
  logoIor: 1.5,
  logoClearcoat: 0.3,
  logoClearcoatRoughness: 0.4,
};

export const templateSchemas: TemplateMetadata[] = [
  {
    id: "tube",
    name: "Image Tube",
    thumbnail: "/templates/tube.jpg",
    durationSeconds: 6,
    paramSchema: buildParamSchema([
      { key: "rows", label: "Rows", type: "number", min: 1, max: 20, step: 1, default: 5 },
      { key: "cols", label: "Columns", type: "number", min: 3, max: 40, step: 1, default: 12 },
      { key: "radius", label: "Radius", type: "number", min: 1, max: 10, step: 0.1, default: 4 },
      { key: "baseSpeed", label: "Speed", type: "number", min: 0, max: 1, step: 0.01, default: 0.25 },
    ]),
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
    paramSchema: buildParamSchema([
      { key: "count", label: "Image Count", type: "number", min: 6, max: 60, step: 1, default: 24 },
      { key: "radius", label: "Radius", type: "number", min: 1, max: 10, step: 0.1, default: 4 },
    ]),
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
    paramSchema: buildParamSchema(
      [
        { key: "count", label: "Image Count", type: "number", min: 6, max: 60, step: 1, default: 24 },
      ],
      rubensCenterpieceDefaults
    ),
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
