"use client";

import { usePathname } from "next/navigation";
import { useEditorStore } from "../store/editorStore";

export function BottomNav() {
  const pathname = usePathname();
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId);
  const setActiveTemplate = useEditorStore((s) => s.setActiveTemplate);

  // If we are in the editor with an active template, the editor's own header and docked timeline take precedence
  if (pathname === "/editor" && activeTemplateId) {
    return null;
  }

  return (
    <nav className="bottomNav" aria-label="Template Presets">
      <button
        id="nav-preset-tube"
        type="button"
        className={`bottomNavItem ${activeTemplateId === "tube" ? "isActive" : ""}`}
        onClick={() => setActiveTemplate("tube")}
      >
        Tube
      </button>
      <button
        id="nav-preset-sphere"
        type="button"
        className={`bottomNavItem ${activeTemplateId === "sphere" ? "isActive" : ""}`}
        onClick={() => setActiveTemplate("sphere")}
      >
        Sphere
      </button>
      <button
        id="nav-preset-rubens"
        type="button"
        className={`bottomNavItem ${activeTemplateId === "rubens" ? "isActive" : ""}`}
        onClick={() => setActiveTemplate("rubens")}
      >
        Rubens
      </button>
    </nav>
  );
}

