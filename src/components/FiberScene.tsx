"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { CenterpieceModel } from "./CenterpieceModel";
import { TextLayer3D } from "./TextLayer3D";
import type { TemplateSceneProps } from "../templates/types";
import type { SlotAsset } from "../types/editor";
import { useVideoTexture } from "../lib/videoTexture";
import {
  DoubleSide,
  Object3D,
  Vector2,
} from "three";
import { useSceneBackgroundParams } from "../hooks/useSceneBackgroundParams";
import { SceneBackground } from "./scene/SceneBackground";
import { useDeterministicAngle } from "../hooks/useDeterministicAngle";

function VideoMaterial({ url }: { url: string }) {
  const texture = useVideoTexture(url);
  return <meshBasicMaterial map={texture} toneMapped={false} side={DoubleSide} />;
}

function ImageMaterial({ url }: { url: string }) {
  const texture = useTexture(url);
  return <meshBasicMaterial map={texture} toneMapped={false} side={DoubleSide} />;
}

function TileMaterial({ asset }: { asset: { kind: "image" | "video"; url: string } }) {
  return (
    <Suspense fallback={<meshBasicMaterial color="#181a20" side={DoubleSide} />}>
      {asset.kind === "video" ? (
        <VideoMaterial url={asset.url} />
      ) : (
        <ImageMaterial url={asset.url} />
      )}
    </Suspense>
  );
}

function ImageTube({
  scrollTargetRef,
  spinVelocityRef,
  naturalDirRef,
  tubeAngleRef,
  rotationSpeedScaleTargetRef,
  rotationSpeedScaleLerpRef,
  baseSpeedRef,
  idleSpinEnabled,
  playbackMode = "interactive",
  progress = 0,
  rows,
  cols,
  radius,
  onHover,
  onUnhover,
}: {
  scrollTargetRef: React.MutableRefObject<number>;
  spinVelocityRef: React.MutableRefObject<number>;
  naturalDirRef: React.MutableRefObject<number>;
  tubeAngleRef: React.MutableRefObject<number>;
  rotationSpeedScaleTargetRef: React.MutableRefObject<number>;
  rotationSpeedScaleLerpRef: React.MutableRefObject<number>;
  baseSpeedRef: React.MutableRefObject<number>;
  idleSpinEnabled: React.MutableRefObject<boolean>;
  playbackMode?: "interactive" | "auto";
  progress?: number;
  rows: number;
  cols: number;
  radius: number;
  onHover?: (name: string) => void;
  onUnhover?: () => void;
}) {
  const groupRef = useRef<Object3D>(null);
  const rowGroupRefs = useRef<Array<Object3D | null>>([]);
  const scrollCurrent = useRef(0);
  const angle = useRef(0);
  const rotationSpeedScale = useRef(1);

  const assetsBySlot = useEditorStore((s) => s.assetsBySlot);
  const legacyImages = useEditorStore((s) => s.images);

  const tubeAssets = useMemo(() => {
    const rawAssets = assetsBySlot["images"];
    if (rawAssets && rawAssets.length > 0) {
      const valid = rawAssets.filter(
        (a): a is Extract<SlotAsset, { kind: "image" | "video" }> =>
          a.kind === "image" || a.kind === "video",
      );
      if (valid.length > 0) return valid;
    }
    if (legacyImages.length > 0) {
      return legacyImages.map((img) => ({
        kind: "image" as const,
        id: img.id,
        url: img.url,
        name: img.name,
      }));
    }
    return [
      { kind: "image" as const, id: "default-1", url: "/tube/im1.jpg", name: "Project 1" },
    ];
  }, [assetsBySlot, legacyImages]);

  const tileW = 0.72;
  const tileH = 1;
  const ySpacing = 2.7;
  const loopHeight = rows * ySpacing;
  const repeatCount = 3;
  const totalRows = rows * repeatCount;

    const rowSpeed = useMemo(() => {
      const speeds: number[] = [];
      for (let r = 0; r < rows; r++) {
        const t = rows <= 1 ? 0 : r / (rows - 1);
        speeds.push(0.65 + t * 0.9);
      }
      return speeds;
    }, [rows]);

    const rowPositions = useMemo(() => {
      const out: Array<{ rowIndex: number; y: number; baseRow: number; rowOffset: number }> = [];
      for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const y = (rowIndex - (totalRows - 1) / 2) * ySpacing;
        const baseRow = rowIndex % rows;
        const rowOffset = baseRow % 2 === 0 ? 0 : 0.5;
        out.push({ rowIndex, y, baseRow, rowOffset });
      }
      return out;
    }, [rows, totalRows, ySpacing]);

    const autoProgress = useDeterministicAngle(angle, playbackMode, progress, 1.0);

    useFrame((_state, dt) => {
      if (autoProgress()) {
        tubeAngleRef.current = angle.current;

        const group = groupRef.current;
        if (!group) return;
        group.position.y = 0;

        for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
          const rowObj = rowGroupRefs.current[rowIndex];
          if (!rowObj) continue;
          const baseRow = rowIndex % rows;
          rowObj.rotation.y = angle.current * rowSpeed[baseRow];
        }
        return; // skip the interactive scroll/spin/damping logic below entirely
      }

      scrollCurrent.current += (scrollTargetRef.current - scrollCurrent.current) * 0.12;

      if (scrollCurrent.current > loopHeight / 2) {
        scrollCurrent.current -= loopHeight;
        scrollTargetRef.current -= loopHeight;
      } else if (scrollCurrent.current < -loopHeight / 2) {
        scrollCurrent.current += loopHeight;
        scrollTargetRef.current += loopHeight;
      }

      const damping = 0.92;
      spinVelocityRef.current *= Math.pow(damping, dt * 60);
      spinVelocityRef.current = Math.max(-2.0, Math.min(2.0, spinVelocityRef.current));

      rotationSpeedScale.current +=
        (rotationSpeedScaleTargetRef.current - rotationSpeedScale.current) *
        rotationSpeedScaleLerpRef.current;

      const scaledDt = dt * rotationSpeedScale.current;

      const baseSpeed = idleSpinEnabled.current ? naturalDirRef.current * baseSpeedRef.current : 0;
      angle.current += (baseSpeed + spinVelocityRef.current) * scaledDt;

      tubeAngleRef.current = angle.current;

      const group = groupRef.current;
      if (!group) return;
      group.position.y = -scrollCurrent.current;

      for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const rowObj = rowGroupRefs.current[rowIndex];
        if (!rowObj) continue;
        const baseRow = rowIndex % rows;
        rowObj.rotation.y = angle.current * rowSpeed[baseRow];
      }
    });

    return (
      <group ref={groupRef}>
        {rowPositions.map(({ rowIndex, y, baseRow, rowOffset }) => (
          <group
            key={rowIndex}
            position={[0, y, 0]}
            ref={(obj) => {
              rowGroupRefs.current[rowIndex] = obj;
            }}
          >
            {Array.from({ length: cols }).map((_, col) => {
              const theta = ((col + rowOffset) / cols) * Math.PI * 2;
              const x = Math.cos(theta) * radius;
              const z = Math.sin(theta) * radius;
              const ry = -(theta + Math.PI / 2);
              const assetIndex = (baseRow * cols + col) % tubeAssets.length;
              const asset = tubeAssets[assetIndex];

              const name = asset.name || `Project ${assetIndex + 1}`;

              return (
                <mesh
                  key={col}
                  position={[x, 0, z]}
                  rotation={[0, ry, 0]}
                  onPointerOver={(e) => {
                    if (playbackMode !== "interactive") return;
                    e.stopPropagation();
                    onHover?.(name);
                  }}
                  onPointerOut={(e) => {
                    if (playbackMode !== "interactive") return;
                    e.stopPropagation();
                    onUnhover?.();
                  }}
                >
                  <planeGeometry args={[tileW, tileH]} />
                  <TileMaterial asset={asset} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>
    );
  }

export function FiberScene({ playbackMode = "interactive", progress = 0 }: TemplateSceneProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetCenterUv = useRef(new Vector2(0.5, 0.5));
  const tubeScrollTarget = useRef(0);
  const tubeSpinVelocity = useRef(0);
  const tubeNaturalDir = useRef(1);
  const tubeAngle = useRef(0);
  const idleSpinEnabled = useRef(false);

  const easing = useEditorStore((s) => s.easing || (s.templateParams.easing as string) || "power1.inOut");

  const tubeRows = (useEditorStore((s) => s.templateParams.rows) as number) ?? 5;
  const tubeCols = (useEditorStore((s) => s.templateParams.cols) as number) ?? 12;
  const tubeRadius = (useEditorStore((s) => s.templateParams.radius) as number) ?? 4;
  const baseSpeed = (useEditorStore((s) => s.templateParams.baseSpeed) as number) ?? 0.25;

  const bgParams = useSceneBackgroundParams();

  const baseSpeedRef = useRef(0.25);

  useEffect(() => {
    baseSpeedRef.current = baseSpeed;
  }, [baseSpeed]);
  const hoverSlowdownEnabledRef = useRef(true);
  const hoverSlowdownScaleRef = useRef(0.35);
  const rotationSpeedScaleTargetRef = useRef(1);
  const rotationSpeedScaleLerpRef = useRef(0.12);

  const isDraggingRef = useRef(false);
  const dragLastXRef = useRef(0);
  const dragLastYRef = useRef(0);
  const dragLastTRef = useRef(0);

  const assetsBySlot = useEditorStore((s) => s.assetsBySlot);
  const textAsset = useMemo(() => {
    const assets = assetsBySlot["text"] || assetsBySlot["title"] || [];
    return assets.find((a): a is Extract<SlotAsset, { kind: "text" }> => a.kind === "text");
  }, [assetsBySlot]);

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const handleHover = useCallback((name: string) => {
    setHoveredProject(name);
    if (hoverSlowdownEnabledRef.current) {
      rotationSpeedScaleTargetRef.current = hoverSlowdownScaleRef.current;
    }
  }, []);

  const handleUnhover = useCallback(() => {
    setHoveredProject(null);
    rotationSpeedScaleTargetRef.current = 1;
  }, []);

    const tooltipElRef = useRef<HTMLDivElement | null>(null);
    const tooltipTarget = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const tooltipCurrent = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const tooltipRaf = useRef<number | null>(null);

    const cursorElRef = useRef<HTMLDivElement | null>(null);
    const cursorTarget = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const cursorCurrent = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const cursorActive = useRef(false);
    const cursorRaf = useRef<number | null>(null);

  const setTooltipFromClientPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    tooltipTarget.current = { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

    useEffect(() => {
      const tick = () => {
        const el = tooltipElRef.current;
        if (el) {
          const lerp = 0.18;
          tooltipCurrent.current.x += (tooltipTarget.current.x - tooltipCurrent.current.x) * lerp;
          tooltipCurrent.current.y += (tooltipTarget.current.y - tooltipCurrent.current.y) * lerp;

          const x = tooltipCurrent.current.x + 12;
          const y = tooltipCurrent.current.y - 18;
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        }

        tooltipRaf.current = requestAnimationFrame(tick);
      };

      tooltipRaf.current = requestAnimationFrame(tick);
      return () => {
        if (tooltipRaf.current != null) cancelAnimationFrame(tooltipRaf.current);
      };
    }, []);

    useEffect(() => {
      const tick = () => {
        const el = cursorElRef.current;
        if (el) {
          const lerp = 0.14;
          cursorCurrent.current.x += (cursorTarget.current.x - cursorCurrent.current.x) * lerp;
          cursorCurrent.current.y += (cursorTarget.current.y - cursorCurrent.current.y) * lerp;

          const x = cursorCurrent.current.x + 8;
          const y = cursorCurrent.current.y + 8;
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%)`;
          el.style.opacity = cursorActive.current ? "1" : "0";
        }

        cursorRaf.current = requestAnimationFrame(tick);
      };

      cursorRaf.current = requestAnimationFrame(tick);
      return () => {
        if (cursorRaf.current != null) cancelAnimationFrame(cursorRaf.current);
      };
    }, []);

    const textFontSize = (useEditorStore((s) => s.templateParams.textFontSize) as number) ?? 0.6;
    const textColor = (useEditorStore((s) => s.templateParams.textColor) as string) ?? "#ffffff";
    const textPositionX = (useEditorStore((s) => s.templateParams.textPositionX) as number) ?? 0;
    const textPositionY = (useEditorStore((s) => s.templateParams.textPositionY) as number) ?? 0;
    const textPositionZ = (useEditorStore((s) => s.templateParams.textPositionZ) as number) ?? 0.5;

    return (
      <div
        className={`sceneRoot ${bgParams.transparentBackground ? "sceneRoot--transparent" : ""}`}
        ref={containerRef}
        style={{ pointerEvents: playbackMode === "interactive" ? "auto" : "none" }}
        onPointerDown={(e) => {
          if (playbackMode !== "interactive") return;
          isDraggingRef.current = true;
          dragLastXRef.current = e.clientX;
          dragLastYRef.current = e.clientY;
          dragLastTRef.current = performance.now();
          (containerRef.current as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (playbackMode !== "interactive") return;
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          cursorTarget.current = { x, y };
          setTooltipFromClientPoint(e.clientX, e.clientY);
          targetCenterUv.current.set(x / rect.width, 1.0 - y / rect.height);

          if (isDraggingRef.current) {
            const now = performance.now();
            const dt = now - dragLastTRef.current;
            const dx = e.clientX - dragLastXRef.current;
            const dy = e.clientY - dragLastYRef.current;
            dragLastXRef.current = e.clientX;
            dragLastYRef.current = e.clientY;
            dragLastTRef.current = now;

            if (dt > 0) {
              tubeSpinVelocity.current = (dx / dt) * 15;
            }
            tubeScrollTarget.current -= dy * 0.01;
          }
        }}
        onPointerUp={(e) => {
          if (playbackMode !== "interactive") return;
          isDraggingRef.current = false;
          try {
            (containerRef.current as HTMLElement).releasePointerCapture(e.pointerId);
          } catch {}
        }}
        onPointerCancel={(e) => {
          if (playbackMode !== "interactive") return;
          isDraggingRef.current = false;
          try {
            (containerRef.current as HTMLElement).releasePointerCapture(e.pointerId);
          } catch {}
        }}
        onPointerEnter={() => {
          if (playbackMode !== "interactive") return;
          cursorActive.current = true;
        }}
        onPointerLeave={() => {
          if (playbackMode !== "interactive") return;
          cursorActive.current = false;
          handleUnhover();
        }}
      >
        <Canvas
          gl={{ alpha: true, preserveDrawingBuffer: true, antialias: true }}
          camera={{ position: [0, 0, 6.5], fov: 50 }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0);
          }}
        >
          <Suspense fallback={null}>
            <SceneBackground
              {...bgParams}
              targetCenterUv={targetCenterUv}
              progress={progress}
              playbackMode={playbackMode}
              easing={easing}
            />

            <ImageTube
              scrollTargetRef={tubeScrollTarget}
              spinVelocityRef={tubeSpinVelocity}
              naturalDirRef={tubeNaturalDir}
              tubeAngleRef={tubeAngle}
              rotationSpeedScaleTargetRef={rotationSpeedScaleTargetRef}
              rotationSpeedScaleLerpRef={rotationSpeedScaleLerpRef}
              baseSpeedRef={baseSpeedRef}
              idleSpinEnabled={idleSpinEnabled}
              playbackMode={playbackMode}
              progress={progress}
              rows={tubeRows}
              cols={tubeCols}
              radius={tubeRadius}
              onHover={handleHover}
              onUnhover={handleUnhover}
            />

            <CenterpieceModel
              fallbackModelUrl="/models/helmet.glb"
              materialParams={{
                transmission: 1,
                thickness: 10,
                roughness: 0,
                metalness: 0.1,
                ior: 1.9,
                dispersion: 1,
                clearcoat: 0.1,
                clearcoatRoughness: 1.1,
                color: "#ffffff",
                transparent: true,
                depthWrite: true,
              }}
              angleRef={tubeAngle}
            />

            {textAsset?.content && (
              <TextLayer3D
                content={textAsset.content}
                fontUrl={textAsset?.fontUrl}
                position={[textPositionX, textPositionY, textPositionZ]}
                color={textColor}
                fontSize={textFontSize}
              />
            )}
          </Suspense>
        </Canvas>

        <div className="whiteEdgeGradient" aria-hidden="true" />
        {hoveredProject && (
          <div
            className="projectTooltip"
            ref={tooltipElRef}
            role="status"
            aria-live="polite"
          >
            {hoveredProject}
          </div>
        )}

        <div className="customCursor" ref={cursorElRef} aria-hidden="true" />
      </div>
    );
}

useGLTF.preload("/models/helmet.glb");
