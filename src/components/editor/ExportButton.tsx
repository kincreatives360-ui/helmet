"use client";
import { useState } from "react";

export function ExportButton({
  templateId,
  durationSeconds,
}: {
  templateId: string;
  durationSeconds: number;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExport = () => {
    setIsExporting(true);
    setStatusMessage(`Preparing ${durationSeconds}s sequence for ${templateId}...`);
    setTimeout(() => {
      setIsExporting(false);
      setStatusMessage("Export engine ready for recording");
      setTimeout(() => setStatusMessage(null), 3000);
    }, 1200);
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
        <span>{isExporting ? "Exporting..." : `Export Video (${durationSeconds}s)`}</span>
      </button>
      {statusMessage && <div className="exportStatus">{statusMessage}</div>}
    </div>
  );
}
