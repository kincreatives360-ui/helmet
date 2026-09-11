"use client";
import { useEditorStore } from "../../store/editorStore";
import { getTemplate } from "../../templates/registry";
import { TemplateGallery } from "../../components/editor/TemplateGallery";
import { ParamControls } from "../../components/editor/ParamControls";
import { AssetPanel } from "../../components/editor/AssetPanel";
import { ExportButton } from "../../components/editor/ExportButton";

export default function EditorPage() {
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId);
  const setActiveTemplate = useEditorStore((s) => s.setActiveTemplate);
  const template = activeTemplateId ? getTemplate(activeTemplateId) : undefined;

  if (!template) {
    return (
      <div className="galleryLayout">
        <header className="galleryHeader">
          <h1 className="galleryTitle">Choose a Template</h1>
          <p className="gallerySubtitle">
            Select a 3D animation preset to customize with your images, logos, and parameters.
          </p>
        </header>
        <TemplateGallery />
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
            ← Templates
          </button>
          <span className="currentTemplateTitle">{template.name}</span>
        </div>
        <AssetPanel slots={template.assetSlots} />
        <ParamControls schema={template.paramSchema} />
        <ExportButton templateId={template.id} durationSeconds={template.durationSeconds} />
      </aside>
      <main className="editorStage">
        <Scene playbackMode="interactive" progress={0} />
      </main>
    </div>
  );
}
