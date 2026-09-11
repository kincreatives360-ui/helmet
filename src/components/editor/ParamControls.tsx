"use client";
import type { ParamField } from "../../templates/types";
import { useEditorStore } from "../../store/editorStore";

export function ParamControls({ schema }: { schema: ParamField[] }) {
  const params = useEditorStore((s) => s.templateParams);
  const setParam = useEditorStore((s) => s.setTemplateParam);

  return (
    <div className="paramControls">
      {schema.map((field) => {
        const value = params[field.key] ?? field.default;

        if (field.type === "number") {
          return (
            <label key={field.key} className="paramField">
              <div className="paramFieldHeader">
                <span className="paramFieldLabel">{field.label}</span>
                <span className="paramFieldValue">{value as number}</span>
              </div>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={value as number}
                onChange={(e) => setParam(field.key, Number(e.target.value))}
                className="paramRangeInput"
              />
            </label>
          );
        }
        if (field.type === "select") {
          return (
            <label key={field.key} className="paramField">
              <span className="paramFieldLabel">{field.label}</span>
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
            </label>
          );
        }
        if (field.type === "boolean") {
          return (
            <label key={field.key} className="paramField checkboxField">
              <div className="paramCheckboxLabel">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => setParam(field.key, e.target.checked)}
                  className="paramCheckboxInput"
                />
                <span>{field.label}</span>
              </div>
            </label>
          );
        }
        // color
        return (
          <label key={field.key} className="paramField">
            <span className="paramFieldLabel">{field.label}</span>
            <div className="paramColorRow">
              <input
                type="color"
                value={value as string}
                onChange={(e) => setParam(field.key, e.target.value)}
                className="paramColorInput"
              />
              <span className="paramColorCode">{value as string}</span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
