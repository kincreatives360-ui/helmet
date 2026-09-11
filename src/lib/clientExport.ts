import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export async function exportVideoClientSide({
  canvas,
  setProgress,
  durationSeconds,
  fps = 30,
  filename = "export.mp4",
  onFrame,
}: {
  canvas: HTMLCanvasElement;
  setProgress: (p: number) => void;
  durationSeconds: number;
  fps?: number;
  filename?: string;
  onFrame: (progress: number) => Promise<void>;
}) {
  const ffmpeg = new FFmpeg();

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
}
