"use client";
import { useEditorStore } from "../../store/editorStore";
import { Layout, Clock } from "lucide-react";

const PRESETS: Record<string, { width: number; height: number } | null> = {
  Square: { width: 1080, height: 1080 },
  Story: { width: 1080, height: 1920 },
  Landscape: { width: 1920, height: 1080 },
  Custom: null,
};

export function CanvasSettings() {
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const durationSeconds = useEditorStore((s) => s.durationSeconds);
  const setDurationSeconds = useEditorStore((s) => s.setDurationSeconds);

  const activePresetName =
    Object.entries(PRESETS).find(
      ([, size]) => size && size.width === canvasSize.width && size.height === canvasSize.height,
    )?.[0] ?? "Custom";

  return (
    <div className="canvasSettings" id="canvas-settings-panel">
      <div className="canvasSettingsHeader">
        <span className="paramControlsTitle">Canvas & Duration</span>
        <Layout size={14} className="sidebarSectionIcon" />
      </div>

      <div className="canvasPresetPills">
        {Object.keys(PRESETS).map((name) => {
          const isSelected = activePresetName === name;
          return (
            <button
              key={name}
              type="button"
              id={`canvas-preset-btn-${name.toLowerCase()}`}
              className={`canvasPresetPill ${isSelected ? "canvasPresetPill--active" : ""}`}
              onClick={() => {
                const preset = PRESETS[name];
                if (preset) setCanvasSize(preset);
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="canvasSizeInputs">
        <label className="canvasDimensionInputLabel">
          <span className="dimensionTag">W</span>
          <input
            id="canvas-width-input"
            type="number"
            value={canvasSize.width}
            onChange={(e) => setCanvasSize({ ...canvasSize, width: Math.max(1, Number(e.target.value)) })}
          />
          <span className="dimensionUnit">px</span>
        </label>
        <label className="canvasDimensionInputLabel">
          <span className="dimensionTag">H</span>
          <input
            id="canvas-height-input"
            type="number"
            value={canvasSize.height}
            onChange={(e) => setCanvasSize({ ...canvasSize, height: Math.max(1, Number(e.target.value)) })}
          />
          <span className="dimensionUnit">px</span>
        </label>
      </div>

      <div className="sidebarDurationSection">
        <div className="sidebarDurationHeader">
          <div className="sidebarDurationTitle">
            <Clock size={13} className="sidebarDurationIcon" />
            <span>Animation Duration</span>
          </div>
          <span className="sidebarDurationVal">{durationSeconds}s</span>
        </div>
        <div className="sidebarDurationInputRow">
          <input
            type="range"
            id="slider-sidebar-duration"
            min={1}
            max={30}
            step={0.5}
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(Number(e.target.value))}
            className="paramRangeInput"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((durationSeconds - 1) / 29) * 100}%, rgba(255, 255, 255, 0.12) ${((durationSeconds - 1) / 29) * 100}%, rgba(255, 255, 255, 0.12) 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
