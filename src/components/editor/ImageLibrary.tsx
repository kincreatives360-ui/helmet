"use client";
/* eslint-disable @next/next/no-img-element */
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDropzone } from "react-dropzone";
import { useEditorStore } from "../../store/editorStore";
import type { SlotAsset } from "../../types/editor";

export function SortableCard({
  id,
  url,
  name,
  kind = "image",
  onRemove,
}: {
  id: string;
  url: string;
  name: string;
  kind?: "image" | "video" | "audio";
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      id={`asset-card-${id}`}
      className="imageCard"
    >
      {kind === "video" ? (
        <video src={url} muted playsInline autoPlay loop draggable={false} className="assetPreviewMedia" />
      ) : kind === "audio" ? (
        <div className="audioCardContent">
          <span className="audioIcon">🎵</span>
          <span className="audioName">{name}</span>
        </div>
      ) : (
        <img src={url} alt={name} draggable={false} className="assetPreviewMedia" />
      )}
      {onRemove && (
        <button
          id={`btn-remove-asset-${id}`}
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
}

export function SortableAssetGrid({ slotId = "images" }: { slotId?: string }) {
  const assetsBySlot = useEditorStore((s) => s.assetsBySlot);
  const legacyImages = useEditorStore((s) => s.images);
  const reorderSlotAssets = useEditorStore((s) => s.reorderSlotAssets);
  const removeAssetFromSlot = useEditorStore((s) => s.removeAssetFromSlot);

  const rawAssets = assetsBySlot[slotId];
  const items: Array<{ id: string; url: string; name: string; kind: "image" | "video" | "audio" }> =
    rawAssets && rawAssets.length > 0
      ? rawAssets.filter((a): a is Extract<SlotAsset, { url: string }> => "url" in a)
      : slotId === "images"
      ? legacyImages.map((img) => ({ ...img, kind: "image" as const }))
      : [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = items.findIndex((item) => item.id === active.id);
    const toIndex = items.findIndex((item) => item.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderSlotAssets(slotId, fromIndex, toIndex);
    }
  };

  if (items.length === 0) return null;

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div id={`asset-grid-${slotId}`} className="cardGrid">
          {items.map((item) => (
            <SortableCard
              key={item.id}
              id={item.id}
              url={item.url}
              name={item.name}
              kind={item.kind}
              onRemove={() => removeAssetFromSlot(slotId, item.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function ImageLibrary({
  slotId = "images",
  multiple = true,
  acceptType = "image",
}: {
  slotId?: string;
  multiple?: boolean;
  acceptType?: "image" | "video" | "audio";
}) {
  const addAssetToSlot = useEditorStore((s) => s.addAssetToSlot);

  const acceptConfig: Record<string, string[]> =
    acceptType === "video"
      ? { "video/*": [] }
      : acceptType === "audio"
      ? { "audio/*": [] }
      : { "image/*": [] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptConfig,
    multiple,
    onDrop: (accepted) => {
      accepted.forEach((file) => {
        const asset: SlotAsset = {
          kind: acceptType,
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          name: file.name,
        };
        addAssetToSlot(slotId, asset);
      });
    },
  });

  const labelText =
    acceptType === "video"
      ? `Drop ${multiple ? "videos" : "a video"} here, or click to upload`
      : acceptType === "audio"
      ? `Drop audio here, or click to upload`
      : `Drop ${multiple ? "images" : "an image"} here, or click to upload`;

  return (
    <div id={`asset-library-${slotId}`} className="imageLibrary">
      <div
        id={`dropzone-${slotId}`}
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "isActive" : ""}`}
      >
        <input id={`input-${slotId}`} {...getInputProps()} />
        <p>{labelText}</p>
      </div>

      <SortableAssetGrid slotId={slotId} />
    </div>
  );
}

