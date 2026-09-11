"use client";
import { useEditorStore } from "../../store/editorStore";

export function LogoUploader() {
  const setCenterpieceLogo = useEditorStore((s) => s.setCenterpieceLogo);
  const centerpieceLogo = useEditorStore((s) => s.centerpieceLogo);

  const handleFile = async (file: File) => {
    if (file.type === "image/svg+xml") {
      const text = await file.text();
      setCenterpieceLogo({ kind: "svg", raw: text });
    } else if (file.type === "image/png") {
      const reader = new FileReader();
      reader.onload = () => setCenterpieceLogo({ kind: "png", raw: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div id="logo-uploader-container" className="logoUploader">
      <input
        id="logo-file-input"
        type="file"
        accept="image/png,image/svg+xml"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {centerpieceLogo && (
        <button
          id="btn-clear-centerpiece-logo"
          type="button"
          onClick={() => setCenterpieceLogo(null)}
          className="logoClearBtn"
        >
          Clear {centerpieceLogo.kind.toUpperCase()} Logo
        </button>
      )}
    </div>
  );
}
