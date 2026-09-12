"use client";
import { useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { getTemplate } from "../../templates/registry";
import { TemplateGallery } from "../../components/editor/TemplateGallery";
import { CanvasSettings } from "../../components/editor/CanvasSettings";
import { ParamControls } from "../../components/editor/ParamControls";
import { AssetPanel } from "../../components/editor/AssetPanel";
import { ExportButton } from "../../components/editor/ExportButton";
import { Timeline } from "../../components/editor/Timeline";
import {
  ChevronLeft,
  Eye,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function EditorPage() {
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId);
  const setActiveTemplate = useEditorStore((s) => s.setActiveTemplate);
  const previewProgress = useEditorStore((s) => s.previewProgress);
  const playbackMode = useEditorStore((s) => s.playbackMode);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const template = activeTemplateId ? getTemplate(activeTemplateId) : undefined;

  // Mobile view toggle state: 'preview' (3D stage + timeline) or 'controls' (sidebar panels)
  const [mobileView, setMobileView] = useState<"preview" | "controls">("preview");
  // Desktop sidebar collapse toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className={`editorLayout ${isSidebarCollapsed ? "editorLayout--sidebarCollapsed" : ""}`}>
      {/* Mobile Top Navigation / View Switcher */}
      <header className="mobileEditorHeader">
        <button
          id="btn-mobile-back-to-gallery"
          type="button"
          className="mobileBackBtn"
          onClick={() => setActiveTemplate(null)}
          aria-label="Back to templates"
        >
          <ChevronLeft size={16} />
          <span>Templates</span>
        </button>

        <div className="mobileViewSegmented">
          <button
            type="button"
            className={`mobileViewBtn ${mobileView === "preview" ? "mobileViewBtn--active" : ""}`}
            onClick={() => setMobileView("preview")}
            aria-label="Switch to 3D Canvas Preview"
          >
            <Eye size={13} />
            <span>3D View</span>
          </button>
          <button
            type="button"
            className={`mobileViewBtn ${mobileView === "controls" ? "mobileViewBtn--active" : ""}`}
            onClick={() => setMobileView("controls")}
            aria-label="Switch to Controls & Parameters"
          >
            <Sliders size={13} />
            <span>Controls</span>
          </button>
        </div>
      </header>

      {/* Editor Sidebar Panel */}
      <aside className={`editorSidebar ${mobileView === "controls" ? "editorSidebar--mobileVisible" : ""}`}>
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
          <button
            type="button"
            className="desktopSidebarToggleBtn"
            onClick={() => setIsSidebarCollapsed(true)}
            title="Collapse sidebar for full-screen canvas"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        <div className="sidebarScrollBody">
          <CanvasSettings />
          <AssetPanel slots={template.assetSlots} />
          <ParamControls schema={template.paramSchema} />
          <ExportButton templateId={template.id} durationSeconds={template.durationSeconds} />
        </div>

        {/* Mobile Floating Quick Switcher to return to 3D view */}
        <div className="mobileSidebarFooter">
          <button
            type="button"
            className="mobileSwitchToPreviewBtn"
            onClick={() => setMobileView("preview")}
          >
            <Eye size={15} />
            <span>View 3D Animation</span>
          </button>
        </div>
      </aside>

      {/* Editor Main 3D Stage */}
      <main className={`editorStage ${mobileView === "preview" ? "editorStage--mobileVisible" : ""}`}>
        {/* Floating Desktop Expand Button when sidebar is collapsed */}
        {isSidebarCollapsed && (
          <button
            type="button"
            className="desktopSidebarExpandBtn"
            onClick={() => setIsSidebarCollapsed(false)}
            title="Expand parameters sidebar"
            aria-label="Expand parameters sidebar"
          >
            <PanelLeftOpen size={16} />
            <span>Controls</span>
          </button>
        )}

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
