"use client";
import { useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { exportVideoClientSide } from "../../lib/clientExport";

export function ExportButton({
  templateId,
  durationSeconds,
}: {
  templateId: string;
  durationSeconds: number;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportPercent, setExportPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const setPreviewProgress = useEditorStore((s) => s.setPreviewProgress);
  const setPlaybackMode = useEditorStore((s) => s.setPlaybackMode);

  const handleExport = async () => {
    if (isExporting) return;

    const canvas = document.querySelector(".editorStage canvas") as HTMLCanvasElement | null
      || document.querySelector("canvas") as HTMLCanvasElement | null;

    if (!canvas) {
      setStatusMessage("Error: Could not find active 3D canvas element.");
      return;
    }

    setIsExporting(true);
    setExportPercent(0);
    setStatusMessage("Initializing in-browser video engine...");
    setPlaybackMode("auto");

    try {
      await exportVideoClientSide({
        canvas,
        durationSeconds,
        fps: 30,
        filename: `${templateId}-export.mp4`,
        setProgress: (p: number) => {
          setExportPercent(Math.round(p * 100));
          setStatusMessage(`Rendering frames... ${Math.round(p * 100)}%`);
        },
        onFrame: async (progressVal: number) => {
          setPreviewProgress(progressVal);
          // Wait for two animation frames so R3F finishes layout and render passes
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          });
        },
      });

      setStatusMessage("Export complete! Download started.");
      setTimeout(() => {
        setStatusMessage(null);
        setExportPercent(0);
      }, 4000);
    } catch (err: unknown) {
      console.error("Client export failed:", err);
      setStatusMessage(
        err instanceof Error ? `Export failed: ${err.message}` : "Export failed. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="exportButtonContainer">
      <button
        id="btn-export-video"
        type="button"
        disabled={isExporting}
        onClick={handleExport}
        className="exportButton"
      >
        <span className="exportIcon">🎬</span>
        <span>{isExporting ? `Exporting (${exportPercent}%)` : `Export Video (${durationSeconds}s)`}</span>
      </button>

      {isExporting && (
        <div className="exportProgressBarWrapper">
          <div
            className="exportProgressBarFill"
            style={{ width: `${exportPercent}%` }}
          />
        </div>
      )}

      {statusMessage && <div className="exportStatus">{statusMessage}</div>}

      <div className="exportCaveatNote">
        <span>⚡ <strong>Client-side export:</strong> Renders directly in your browser. Best for quick local test clips.</span>
      </div>
    </div>
  );
}

