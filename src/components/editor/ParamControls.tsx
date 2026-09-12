"use client";
import { useState } from "react";
import type { ParamField } from "../../templates/types";
import { useEditorStore } from "../../store/editorStore";
import {
  Sliders,
  ChevronDown,
  LayoutGrid,
  Box,
  Type,
  Grid,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const MATERIAL_PRESETS = [
  {
    id: "glass",
    label: "Crystal Glass",
    icon: "💎",
    params: {
      logoColor: "#ffffff",
      logoMetalness: 0.05,
      logoRoughness: 0,
      logoTransmission: 1,
      logoThickness: 10,
      logoIor: 1.9,
      logoClearcoat: 0.2,
      logoClearcoatRoughness: 0.1,
    },
  },
  {
    id: "chrome",
    label: "Liquid Chrome",
    icon: "🪙",
    params: {
      logoColor: "#f1f5f9",
      logoMetalness: 1.0,
      logoRoughness: 0.05,
      logoTransmission: 0,
      logoThickness: 0,
      logoIor: 2.3,
      logoClearcoat: 1.0,
      logoClearcoatRoughness: 0.05,
    },
  },
  {
    id: "obsidian",
    label: "Obsidian Noir",
    icon: "🖤",
    params: {
      logoColor: "#111217",
      logoMetalness: 0.85,
      logoRoughness: 0.12,
      logoTransmission: 0,
      logoThickness: 0,
      logoIor: 1.6,
      logoClearcoat: 0.8,
      logoClearcoatRoughness: 0.2,
    },
  },
  {
    id: "gold",
    label: "Imperial Gold",
    icon: "✨",
    params: {
      logoColor: "#f5c57a",
      logoMetalness: 0.95,
      logoRoughness: 0.2,
      logoTransmission: 0,
      logoThickness: 0,
      logoIor: 1.8,
      logoClearcoat: 0.4,
      logoClearcoatRoughness: 0.3,
    },
  },
];

export function ParamControls({ schema }: { schema: ParamField[] }) {
  const params = useEditorStore((s) => s.templateParams);
  const setParam = useEditorStore((s) => s.setTemplateParam);

  // Collapsible groups state - Default 'preset' expanded, other advanced parameters collapsed
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    preset: false,
    centerpiece: true,
    text: true,
    canvas: true,
  });

  if (!schema || schema.length === 0) return null;

  // Group definitions helper predicates
  const isCenterpieceKey = (key: string) => key.startsWith("logo");
  const isTextKey = (key: string) => key.startsWith("text");
  const isCanvasKey = (key: string) =>
    [
      "showGrid",
      "transparentBackground",
      "backgroundColor",
      "gridScale",
      "gridLineWidth",
      "gridColor",
      "environmentPreset",
      "environmentBlur",
      "cameraParallax",
    ].includes(key);

  const isPresetKey = (key: string) =>
    !isCenterpieceKey(key) && !isTextKey(key) && !isCanvasKey(key);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    setCollapsedGroups({
      preset: false,
      centerpiece: false,
      text: false,
      canvas: false,
    });
  };

  const handleCollapseAll = () => {
    setCollapsedGroups({
      preset: true,
      centerpiece: true,
      text: true,
      canvas: true,
    });
  };

  // Build the list of groups
  const groups = [
    {
      id: "preset",
      title: "Preset & Animation",
      icon: LayoutGrid,
      fields: schema.filter((field) => isPresetKey(field.key)),
    },
    {
      id: "centerpiece",
      title: "3D Centerpiece Logo",
      icon: Box,
      fields: schema.filter((field) => isCenterpieceKey(field.key)),
    },
    {
      id: "text",
      title: "3D Text Layer",
      icon: Type,
      fields: schema.filter((field) => isTextKey(field.key)),
    },
    {
      id: "canvas",
      title: "Canvas & Background",
      icon: Grid,
      fields: schema.filter((field) => isCanvasKey(field.key)),
    },
  ].filter((g) => g.fields.length > 0); // Only render groups with fields

  const renderField = (field: ParamField) => {
    const value = params[field.key] ?? field.default;

    if (field.type === "number") {
      const numVal = typeof value === "number" ? value : Number(field.default);
      const min = field.min ?? 0;
      const max = field.max ?? 100;
      const percent = Math.max(0, Math.min(100, ((numVal - min) / (max - min || 1)) * 100));

      return (
        <label key={field.key} className="paramField">
          <div className="paramFieldHeader">
            <span className="paramFieldLabel">{field.label}</span>
            <span className="paramFieldValue">{numVal}</span>
          </div>
          <div className="paramSliderContainer">
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={numVal}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percent}%, rgba(255, 255, 255, 0.12) ${percent}%, rgba(255, 255, 255, 0.12) 100%)`,
              }}
              onChange={(e) => setParam(field.key, Number(e.target.value))}
              className="paramRangeInput"
            />
          </div>
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.key} className="paramField">
          <div className="paramFieldHeader">
            <span className="paramFieldLabel">{field.label}</span>
          </div>
          <div className="paramSelectWrapper">
            <select
              value={value as string}
              onChange={(e) => setParam(field.key, e.target.value)}
              className="paramSelectInput"
            >
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="paramSelectChevron" />
          </div>
        </label>
      );
    }

    if (field.type === "boolean") {
      const isChecked = Boolean(value);
      return (
        <div key={field.key} className="paramField">
          <div className="paramFieldHeader">
            <span className="paramFieldLabel">{field.label}</span>
          </div>
          <div className="paramSegmentedGroup">
            <button
              type="button"
              className={`paramSegmentBtn ${!isChecked ? "paramSegmentBtn--active" : ""}`}
              onClick={() => setParam(field.key, false)}
            >
              Off
            </button>
            <button
              type="button"
              className={`paramSegmentBtn ${isChecked ? "paramSegmentBtn--active" : ""}`}
              onClick={() => setParam(field.key, true)}
            >
              On
            </button>
          </div>
        </div>
      );
    }

    if (field.type === "string") {
      const strVal = typeof value === "string" ? value : String(value ?? "");
      return (
        <label key={field.key} className="paramField">
          <div className="paramFieldHeader">
            <span className="paramFieldLabel">{field.label}</span>
          </div>
          <input
            type="text"
            value={strVal}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            onChange={(e) => setParam(field.key, e.target.value)}
            className="paramTextInput"
          />
        </label>
      );
    }

    // Color field
    return (
      <label key={field.key} className="paramField">
        <div className="paramFieldHeader">
          <span className="paramFieldLabel">{field.label}</span>
        </div>
        <div className="paramColorRow">
          <div className="paramColorSwatchWrapper">
            <input
              type="color"
              value={value as string}
              onChange={(e) => setParam(field.key, e.target.value)}
              className="paramColorInput"
            />
          </div>
          <span className="paramColorCode">{value as string}</span>
        </div>
      </label>
    );
  };

  return (
    <div className="paramControls" id="param-controls-panel">
      {/* Panel Header with Title & Expansion Utilities */}
      <div className="paramControlsHeader">
        <div className="paramGroupHeaderLeft">
          <span className="paramControlsTitle">Parameters</span>
          <Sliders size={13} className="paramGroupIcon" />
        </div>
        <div className="paramHeaderActions">
          <button
            type="button"
            onClick={handleExpandAll}
            className="paramHeaderActionBtn"
          >
            Expand All
          </button>
          <span className="paramHeaderActionSeparator">|</span>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="paramHeaderActionBtn"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Grouped & Collapsible Parameter List */}
      <div className="paramControlsList" style={{ marginTop: "4px" }}>
        {groups.map((group) => {
          const GroupIcon = group.icon;
          const isCollapsed = collapsedGroups[group.id];

          return (
            <div key={group.id} className="paramGroupContainer">
              {/* Group Toggle Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleGroup(group.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleGroup(group.id);
                  }
                }}
                className={`paramGroupHeader ${
                  isCollapsed ? "paramGroupHeader--collapsed" : ""
                }`}
                aria-expanded={!isCollapsed}
              >
                <div className="paramGroupHeaderLeft">
                  <GroupIcon size={14} className="paramGroupIcon" />
                  <span className="paramGroupTitle">
                    {group.title}
                  </span>
                  <span className="paramGroupBadge">
                    {group.fields.length}
                  </span>
                </div>
                <div className="paramGroupHeaderRight">
                  <button
                    type="button"
                    title={`Reset ${group.title} to defaults`}
                    onClick={(e) => {
                      e.stopPropagation();
                      group.fields.forEach((f) => setParam(f.key, f.default));
                    }}
                    className="paramGroupResetBtn"
                    aria-label={`Reset ${group.title} to defaults`}
                  >
                    <RotateCcw size={11} />
                  </button>
                  <ChevronDown
                    size={14}
                    className={`paramGroupChevron ${
                      isCollapsed ? "paramGroupChevron--collapsed" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Group Body List with Height-Based Transition */}
              <div
                className={`paramGroupCollapse ${
                  isCollapsed ? "paramGroupCollapse--collapsed" : ""
                }`}
                aria-hidden={isCollapsed}
              >
                <div className="paramGroupCollapseInner">
                  <div className="paramGroupContent">
                    {group.id === "centerpiece" && (
                      <div className="materialPresetsContainer">
                        <div className="materialPresetsHeader">
                          <span className="materialPresetsTitle">
                            Material Styles
                          </span>
                          <Sparkles size={11} className="text-amber-400 opacity-75" />
                        </div>
                        <div className="materialPresetsGrid">
                          {MATERIAL_PRESETS.map((mat) => (
                            <button
                              key={mat.id}
                              type="button"
                              className="materialPresetBtn"
                              title={`Apply ${mat.label} style`}
                              onClick={() => {
                                Object.entries(mat.params).forEach(([k, v]) => setParam(k, v));
                              }}
                            >
                              <span className="materialPresetIcon">{mat.icon}</span>
                              <span className="materialPresetName">{mat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {group.fields.map((field) => renderField(field))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
