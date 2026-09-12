"use client";
import { useEditorStore } from "../../store/editorStore";
import { getTemplate } from "../../templates/registry";
import { TemplateGallery } from "../../components/editor/TemplateGallery";
import { CanvasSettings } from "../../components/editor/CanvasSettings";
import { ParamControls } from "../../components/editor/ParamControls";
import { AssetPanel } from "../../components/editor/AssetPanel";
import { ExportButton } from "../../components/editor/ExportButton";
import { Timeline } from "../../components/editor/Timeline";
import { ChevronLeft } from "lucide-react";

export default function EditorPage() {
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId);
  const setActiveTemplate = useEditorStore((s) => s.setActiveTemplate);
  const previewProgress = useEditorStore((s) => s.previewProgress);
  const playbackMode = useEditorStore((s) => s.playbackMode);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const template = activeTemplateId ? getTemplate(activeTemplateId) : undefined;

  if (!template) {
    return (
      <div className="galleryLayout">
        <div className="galleryContainer">
          <header className="galleryHeader">
            <h1 className="galleryTitle">Choose a Template</h1>
            <p className="gallerySubtitle">
              Select a 3D animation preset to customize with your images, logos, and parameters.
            </p>
          </header>
          <TemplateGallery />
        </div>
      </div>
    );
  }

  const Scene = template.SceneComponent;

  return (
    <div className="editorLayout">
      <aside className="editorSidebar">
        <div className="sidebarHeader">
          <button
            id="btn-back-to-gallery"
            type="button"
            className="backToGalleryBtn"
            onClick={() => setActiveTemplate(null)}
          >
            <ChevronLeft size={14} className="backToGalleryIcon" />
            <span>Templates</span>
          </button>
          <span className="currentTemplateTitle">{template.name}</span>
        </div>
        <CanvasSettings />
        <AssetPanel slots={template.assetSlots} />
        <ParamControls schema={template.paramSchema} />
        <ExportButton templateId={template.id} durationSeconds={template.durationSeconds} />
      </aside>
      <main className="editorStage">
        <div className="editorStageWrapper">
          <div className="canvasStageContainer">
            <div className="canvasDimensionBadge">
              <span>{canvasSize.width} × {canvasSize.height} px</span>
            </div>
            <div
              className="canvasViewportFrame"
              id="canvas-viewport-frame"
              style={{
                aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
              }}
            >
              <Scene playbackMode={playbackMode} progress={previewProgress} />
            </div>
          </div>
          <div className="editorStageTimelineDock">
            <Timeline durationSeconds={template.durationSeconds} />
          </div>
        </div>
      </main>
    </div>
  );
}
