import { useEditorStore } from "../store/editorStore";

export function useSceneBackgroundParams() {
  return {
    gridScale: (useEditorStore((s) => s.templateParams.gridScale) as number) ?? 28,
    gridLineWidth: (useEditorStore((s) => s.templateParams.gridLineWidth) as number) ?? 0.5,
    gridColor: (useEditorStore((s) => s.templateParams.gridColor) as string) ?? "#1a1a1a",
    backgroundColor: (useEditorStore((s) => s.templateParams.backgroundColor) as string) ?? "#000000",
    showGrid: (useEditorStore((s) => s.templateParams.showGrid) as boolean) ?? true,
    transparentBackground: (useEditorStore((s) => s.templateParams.transparentBackground) as boolean) ?? false,
    environmentPreset: (useEditorStore((s) => s.templateParams.environmentPreset) as string) ?? "studio",
    environmentBlur: (useEditorStore((s) => s.templateParams.environmentBlur) as number) ?? 0.5,
    cameraParallax: (useEditorStore((s) => s.templateParams.cameraParallax) as number) ?? 0.3,
  };
}
