"use client";
import type { AssetSlot } from "../../templates/types";
import type { SlotAsset } from "../../types/editor";
import { ImageLibrary } from "./ImageLibrary";
import { LogoUploader } from "./LogoUploader";
import { useEditorStore } from "../../store/editorStore";

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
          <span className="fontUploadIcon">🔤</span>
          <span className="fontUploadText">
            {fontName ? `Font: ${fontName}` : "Upload Brand Font (.woff, .ttf)"}
          </span>
          <input
            id={`font-upload-${slot.id}`}
            type="file"
            accept=".woff,.woff2,.ttf,.otf"
            onChange={handleFontUpload}
            className="fontFileInput"
          />
        </label>
        {fontName && (
          <button
            type="button"
            onClick={handleRemoveFont}
            className="removeFontBtn"
            title="Reset font"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export function AssetPanel({ slots }: { slots: AssetSlot[] }) {
  return (
    <div id="asset-panel-container" className="assetPanel">
      <div className="assetPanelHeader">
        <h3 className="assetPanelTitle">Assets</h3>
      </div>
      <div className="assetSlotsList">
        {slots.map((slot) => (
          <div key={slot.id} className="assetSlot">
            <div className="assetSlotHeader">
              <span className="assetSlotLabel">{slot.label}</span>
              <span className="assetSlotBadge">
                {slot.type} {slot.multiple ? "(multi)" : "(single)"}
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
                <p className="assetSlotHelp">Upload SVG or transparent PNG for 3D extrusion</p>
                <LogoUploader />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
