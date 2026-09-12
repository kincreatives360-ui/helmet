"use client";
import Image from "next/image";
import { templates } from "../../templates/registry";
import { useEditorStore } from "../../store/editorStore";

export function TemplateGallery() {
  const setActiveTemplate = useEditorStore((s) => s.setActiveTemplate);
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId);

  return (
    <div id="template-gallery-container" className="templateGallery">
      {templates.map((tpl) => {
        const isActive = activeTemplateId === tpl.id;
        return (
          <button
            key={tpl.id}
            id={`template-card-${tpl.id}`}
            type="button"
            className={`templateCard ${isActive ? "isActive" : ""}`}
            onClick={() => setActiveTemplate(tpl.id)}
          >
            <div className="templateThumbnailWrapper">
              <Image
                src={tpl.thumbnail}
                alt={tpl.name}
                width={320}
                height={180}
                loading="eager"
                priority
                referrerPolicy="no-referrer"
                className="templateThumbnail"
              />
            </div>
            <span className="templateCardTitle">{tpl.name}</span>
          </button>
        );
      })}
    </div>
  );
}
