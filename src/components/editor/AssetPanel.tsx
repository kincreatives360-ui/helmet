"use client";
import type { AssetSlot } from "../../templates/types";
import type { SlotAsset } from "../../types/editor";
import { ImageLibrary } from "./ImageLibrary";
import { LogoUploader } from "./LogoUploader";
import { useEditorStore } from "../../store/editorStore";
import { FolderKanban, Type, Upload, X } from "lucide-react";

function TextSlotControl({ slot }: { slot: AssetSlot }) {
  const assetsBySlot = useEditorStore((s) => s.assetsBySlot);
  const addAssetToSlot = useEditorStore((s) => s.addAssetToSlot);
  const removeAssetFromSlot = useEditorStore((s) => s.removeAssetFromSlot);

  const slotAssets = assetsBySlot[slot.id] || [];
  const textAsset = slotAssets.find((a): a is Extract<SlotAsset, { kind: "text" }> => a.kind === "text");
  const content = textAsset?.content ?? "";
  const fontName = textAsset?.fontName;
  const fontUrl = textAsset?.fontUrl;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    removeAssetFromSlot(slot.id, slot.id);
    if (val.trim() || fontUrl) {
      addAssetToSlot(slot.id, {
        kind: "text",
        id: slot.id,
        content: val,
        fontUrl,
        fontName,
      });
    }
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fontUrl && fontUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fontUrl);
    }

    const newFontUrl = URL.createObjectURL(file);
    removeAssetFromSlot(slot.id, slot.id);
    addAssetToSlot(slot.id, {
      kind: "text",
      id: slot.id,
      content,
      fontUrl: newFontUrl,
      fontName: file.name,
    });
  };

  const handleRemoveFont = () => {
    if (fontUrl && fontUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fontUrl);
    }
    removeAssetFromSlot(slot.id, slot.id);
    if (content.trim()) {
      addAssetToSlot(slot.id, {
        kind: "text",
        id: slot.id,
        content,
      });
    }
  };

  return (
    <div className="textSlotControl">
      <textarea
        id={`text-slot-${slot.id}`}
        value={content}
        onChange={handleTextChange}
        placeholder={`Enter ${slot.label.toLowerCase()} text here...`}
        rows={3}
        className="textSlotTextarea"
      />

      <div className="fontUploadSection">
        <label className="fontUploadLabel">
          <Type size={14} className="fontUploadIcon" />
          <span className="fontUploadText">
            {fontName ? `Font: ${fontName}` : "Custom Font (.woff, .ttf)"}
          </span>
          <input
            id={`font-upload-${slot.id}`}
            type="file"
            accept=".woff,.woff2,.ttf,.otf"
            onChange={handleFontUpload}
            className="fontFileInput"
          />
          <Upload size={12} className="fontUploadTrailingIcon" />
        </label>
        {fontName && (
          <button
            type="button"
            onClick={handleRemoveFont}
            className="removeFontBtn"
            title="Reset font"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function AssetPanel({ slots }: { slots: AssetSlot[] }) {
  if (!slots || slots.length === 0) return null;

  return (
    <div id="asset-panel-container" className="assetPanel">
      <div className="assetPanelHeader">
        <span className="assetPanelTitle">Assets</span>
        <FolderKanban size={14} className="sidebarSectionIcon" />
      </div>
      <div className="assetSlotsList">
        {slots.map((slot) => (
          <div key={slot.id} className="assetSlot">
            <div className="assetSlotHeader">
              <span className="assetSlotLabel">{slot.label}</span>
              <span className="assetSlotBadge">
                {slot.type} {slot.multiple ? "• multi" : ""}
              </span>
            </div>

            {(slot.type === "image" || slot.type === "video" || slot.type === "audio") && (
              <div className="assetSlotContent">
                <ImageLibrary
                  slotId={slot.id}
                  multiple={slot.multiple}
                  acceptType={slot.type}
                />
              </div>
            )}

            {slot.type === "text" && (
              <div className="assetSlotContent">
                <TextSlotControl slot={slot} />
              </div>
            )}

            {slot.type === "logo" && (
              <div className="assetSlotContent">
                <p className="assetSlotHelp">SVG/PNG for 3D-extruded logos, or upload a .glb model or photo to use directly</p>
                <LogoUploader />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
