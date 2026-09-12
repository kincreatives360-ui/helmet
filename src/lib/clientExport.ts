import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export async function exportVideoClientSide({
  canvas,
  setProgress,
  durationSeconds,
  fps = 30,
  filename = "export.mp4",
  width,
  height,
  onFrame,
}: {
  canvas: HTMLCanvasElement;
  setProgress: (p: number) => void;
  durationSeconds: number;
  fps?: number;
  filename?: string;
  width?: number;
  height?: number;
  onFrame: (progress: number) => Promise<void>;
}) {
  const origWidth = canvas.width;
  const origHeight = canvas.height;

  // Retrieve R3F gl renderer if present
  const r3fStore = (
    canvas as unknown as {
      __r3f?: {
        store?: {
          getState?: () => {
            gl?: { setSize: (w: number, h: number, updateStyle?: boolean) => void };
          };
        };
      };
    }
  ).__r3f?.store;
  const gl = r3fStore?.getState?.()?.gl;

  if (width && height) {
    if (gl && typeof gl.setSize === "function") {
      gl.setSize(width, height, false);
    } else {
      canvas.width = width;
      canvas.height = height;
    }
  }

  const ffmpeg = new FFmpeg();

  try {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
    } catch {
      await ffmpeg.load();
    }

    const totalFrames = Math.max(2, Math.round(durationSeconds * fps));

    for (let i = 0; i < totalFrames; i++) {
      const progress = i / (totalFrames - 1);
      setProgress(progress);
      await onFrame(progress);
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png"),
      );
      await ffmpeg.writeFile(
        `frame${String(i).padStart(4, "0")}.png`,
        await fetchFile(blob),
      );
    }

    await ffmpeg.exec([
      "-framerate",
      String(fps),
      "-i",
      "frame%04d.png",
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "out.mp4",
    ]);

    const data = (await ffmpeg.readFile("out.mp4")) as Uint8Array;
    const url = URL.createObjectURL(new Blob([data.buffer as ArrayBuffer], { type: "video/mp4" }));

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  } finally {
    if (width && height) {
      if (gl && typeof gl.setSize === "function") {
        gl.setSize(origWidth, origHeight, false);
      } else {
        canvas.width = origWidth;
        canvas.height = origHeight;
      }
    }
  }
}

