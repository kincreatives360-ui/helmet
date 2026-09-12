"use client";
import { useEditorStore } from "../../store/editorStore";

export function LogoUploader() {
  const setCenterpieceLogo = useEditorStore((s) => s.setCenterpieceLogo);
  const centerpieceLogo = useEditorStore((s) => s.centerpieceLogo);

  const handleFile = async (file: File) => {
    const isModel = file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf");

    if (isModel) {
      setCenterpieceLogo({ kind: "model", url: URL.createObjectURL(file), keepOriginalMaterial: false });
    } else if (file.type === "image/svg+xml") {
      const text = await file.text();
      setCenterpieceLogo({ kind: "svg", raw: text });
    } else if (file.type === "image/png") {
      const reader = new FileReader();
      reader.onload = () => setCenterpieceLogo({ kind: "png", raw: reader.result as string });
      reader.readAsDataURL(file);
    } else if (file.type === "image/jpeg" || file.type === "image/webp") {
      setCenterpieceLogo({ kind: "photo", url: URL.createObjectURL(file) });
    }
  };

  const handleToggleMaterial = () => {
    if (centerpieceLogo && centerpieceLogo.kind === "model") {
      setCenterpieceLogo({
        ...centerpieceLogo,
        keepOriginalMaterial: !centerpieceLogo.keepOriginalMaterial,
      });
    }
  };

  return (
    <div id="logo-uploader-container" className="logoUploader flex flex-col gap-3">
      <input
        id="logo-file-input"
        type="file"
        accept="image/png,image/svg+xml,image/jpeg,image/webp,.glb,.gltf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {centerpieceLogo && centerpieceLogo.kind === "model" && (
        <label id="toggle-material-label" className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
          <input
            id="toggle-material-checkbox"
            type="checkbox"
            checked={!!centerpieceLogo.keepOriginalMaterial}
            onChange={handleToggleMaterial}
            className="rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500"
          />
          Keep model&apos;s original materials
        </label>
      )}
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
