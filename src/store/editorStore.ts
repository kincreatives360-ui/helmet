import { create } from "zustand";
import type { EditorState, CenterpieceLogo, SlotAsset } from "../types/editor";
import { getDefaultParams } from "../templates/schemas";

type EditorActions = {
  addAssetToSlot: (slotId: string, asset: SlotAsset) => void;
  removeAssetFromSlot: (slotId: string, assetId: string) => void;
  reorderSlotAssets: (slotId: string, fromIndex: number, toIndex: number) => void;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  reorderImages: (fromIndex: number, toIndex: number) => void;
  setActivePreset: (preset: EditorState["activePreset"]) => void;
  setActiveTemplate: (id: string | null) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setTubeParams: (params: Partial<EditorState["tubeParams"]>) => void;
  setTemplateParam: (key: string, value: number | string | boolean) => void;
  setCenterpieceLogo: (logo: CenterpieceLogo | null) => void;
  setPreviewProgress: (progress: number) => void;
  setEasing: (easing: string) => void;
  setPlaybackMode: (mode: "interactive" | "auto") => void;
};

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  assetsBySlot: {},
  images: [],
  activePreset: "tube",
  activeTemplateId: "tube",
  canvasSize: { width: 1080, height: 1080 },
  tubeParams: { rows: 5, cols: 12, radius: 4, baseSpeed: 0.25 },
  templateParams: {
    rows: 5,
    cols: 12,
    radius: 4,
    baseSpeed: 0.25,
    count: 24,
  },
  centerpieceLogo: null,
  previewProgress: 0,
  easing: "power1.inOut",
  playbackMode: "interactive",

  addAssetToSlot: (slotId, asset) => {
    set((state) => {
      const currentList = state.assetsBySlot[slotId] || [];
      const updatedList = [...currentList, asset];
      const nextAssetsBySlot = { ...state.assetsBySlot, [slotId]: updatedList };

      const nextImages =
        slotId === "images" && asset.kind === "image"
          ? [...state.images, { id: asset.id, url: asset.url, name: asset.name }]
          : state.images;

      return {
        assetsBySlot: nextAssetsBySlot,
        images: nextImages,
      };
    });
  },

  removeAssetFromSlot: (slotId, assetId) => {
    set((state) => {
      const currentList = state.assetsBySlot[slotId] || [];
      const target = currentList.find((a) => a.id === assetId);
      if (target) {
        if ("url" in target && target.url.startsWith("blob:")) {
          URL.revokeObjectURL(target.url);
        }
        if ("fontUrl" in target && target.fontUrl && target.fontUrl.startsWith("blob:")) {
          URL.revokeObjectURL(target.fontUrl);
        }
      }
      const updatedList = currentList.filter((a) => a.id !== assetId);
      const nextAssetsBySlot = { ...state.assetsBySlot, [slotId]: updatedList };

      const nextImages =
        slotId === "images" ? state.images.filter((img) => img.id !== assetId) : state.images;

      return {
        assetsBySlot: nextAssetsBySlot,
        images: nextImages,
      };
    });
  },

  reorderSlotAssets: (slotId, fromIndex, toIndex) => {
    set((state) => {
      const currentList = [...(state.assetsBySlot[slotId] || [])];
      if (fromIndex < 0 || fromIndex >= currentList.length || toIndex < 0 || toIndex >= currentList.length) {
        return state;
      }
      const [moved] = currentList.splice(fromIndex, 1);
      currentList.splice(toIndex, 0, moved);
      const nextAssetsBySlot = { ...state.assetsBySlot, [slotId]: currentList };

      let nextImages = state.images;
      if (slotId === "images") {
        const copyImages = [...state.images];
        if (fromIndex >= 0 && fromIndex < copyImages.length && toIndex >= 0 && toIndex < copyImages.length) {
          const [movedImg] = copyImages.splice(fromIndex, 1);
          copyImages.splice(toIndex, 0, movedImg);
          nextImages = copyImages;
        }
      }

      return {
        assetsBySlot: nextAssetsBySlot,
        images: nextImages,
      };
    });
  },

  setActiveTemplate: (id) => {
    // Revoke any created blob URLs across all slots to prevent leaks
    Object.values(get().assetsBySlot).forEach((slotList) => {
      slotList.forEach((asset) => {
        if ("url" in asset && asset.url.startsWith("blob:")) {
          URL.revokeObjectURL(asset.url);
        }
        if ("fontUrl" in asset && asset.fontUrl && asset.fontUrl.startsWith("blob:")) {
          URL.revokeObjectURL(asset.fontUrl);
        }
      });
    });
    get().images.forEach((img) => {
      if (img.url.startsWith("blob:")) {
        URL.revokeObjectURL(img.url);
      }
    });

    const defaults = id ? getDefaultParams(id) : {};
    const nextTubeParams = {
      rows: typeof defaults.rows === "number" ? defaults.rows : 5,
      cols: typeof defaults.cols === "number" ? defaults.cols : 12,
      radius: typeof defaults.radius === "number" ? defaults.radius : 4,
      baseSpeed: typeof defaults.baseSpeed === "number" ? defaults.baseSpeed : 0.25,
    };
    set({
      activeTemplateId: id,
      activePreset: id === "tube" || id === "sphere" || id === "rubens" ? id : "tube",
      assetsBySlot: {},
      images: [],
      centerpieceLogo: null,
      templateParams: defaults,
      tubeParams: nextTubeParams,
    });
  },

  setTemplateParam: (key, value) => {
    set((state) => {
      const nextTemplateParams = { ...state.templateParams, [key]: value };
      const nextTubeParams = { ...state.tubeParams };
      if (key in nextTubeParams && typeof value === "number") {
        (nextTubeParams as Record<string, number>)[key] = value;
      }
      return {
        templateParams: nextTemplateParams,
        tubeParams: nextTubeParams,
      };
    });
  },

  addImages: (files) => {
    const newAssets = files.map((file) => ({
      kind: "image" as const,
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    set((state) => ({
      assetsBySlot: {
        ...state.assetsBySlot,
        images: [...(state.assetsBySlot.images || []), ...newAssets],
      },
      images: [
        ...state.images,
        ...newAssets.map((a) => ({ id: a.id, url: a.url, name: a.name })),
      ],
    }));
  },

  removeImage: (id) => {
    get().removeAssetFromSlot("images", id);
  },

  reorderImages: (fromIndex, toIndex) => {
    get().reorderSlotAssets("images", fromIndex, toIndex);
  },

  setActivePreset: (preset) => set({ activePreset: preset }),
  setCanvasSize: (size) => set({ canvasSize: size }),
  setTubeParams: (params) =>
    set((state) => ({ tubeParams: { ...state.tubeParams, ...params } })),
  setCenterpieceLogo: (logo) => set({ centerpieceLogo: logo }),
  setPreviewProgress: (progress) => set({ previewProgress: progress }),
  setEasing: (easing) => set({ easing }),
  setPlaybackMode: (mode) => set({ playbackMode: mode }),
}));

