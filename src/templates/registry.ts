import type { TemplateDefinition } from "./types";
import { templateSchemas } from "./schemas";
import { FiberScene } from "../components/FiberScene";
import { CodropScene } from "../components/CodropScene";
import { RubensScene } from "../components/RubensScene";

const sceneMap = {
  tube: FiberScene,
  sphere: CodropScene,
  rubens: RubensScene,
};

export const templates: TemplateDefinition[] = templateSchemas.map((schema) => ({
  ...schema,
  SceneComponent: sceneMap[schema.id as keyof typeof sceneMap] ?? FiberScene,
}));

export function getTemplate(id: string) {
  return templates.find((t) => t.id === id);
}
